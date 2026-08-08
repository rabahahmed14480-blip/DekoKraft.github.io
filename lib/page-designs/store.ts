import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  DesignProposal,
  DesignReview,
  DesignVersion,
  DesignVersionTrigger,
  PageDesign,
  PageDesignFile,
  PageDesignLibrary,
  PageDesignSource,
  TestResult,
} from "./types";

export const sourceFiles: Record<PageDesignSource, readonly string[]> = {
  admin: [
    "app/admin/page.tsx",
    "app/admin/components/AdminShell.tsx",
    "app/admin/components/AdminCleanToolbar.tsx",
    "app/admin/admin-v2.css",
    "app/components/home-v2/HomepageArchitecture.tsx",
    "app/components/home-v2/HomepageSurface.tsx",
    "app/components/announcements/AnnouncementEditorModal.tsx",
  ],
  participant: [
    "app/participant/page.tsx",
    "app/participant/layout.tsx",
    "app/participant/components/ParticipantStudioShell.tsx",
    "app/participant/participant.css",
    "app/components/home-v2/HomepageArchitecture.tsx",
    "app/components/home-v2/HomepageSurface.tsx",
    "app/components/announcements/AnnouncementEditorModal.tsx",
  ],
};

const testNames = [
  ["typecheck", "Type checking", true],
  ["lint", "Lint", true],
  ["routes", "Route rendering", true],
  ["rtl", "RTL", true],
  ["ltr", "LTR", true],
  ["responsive", "Responsive layout", true],
  ["permissions", "Permission checks", true],
  ["accessibility", "Accessibility checks", true],
  ["unit", "Unit tests", false],
  ["integration", "Integration tests", false],
] as const;

const filePath = (root: string) => path.join(root, ".dekokraft", "page-designs.json");
const clone = <T,>(value: T): T => structuredClone(value);
const fingerprint = (files: PageDesignFile[]) =>
  createHash("sha256")
    .update(files.map((file) => `${file.path}\0${file.content}`).join("\0"))
    .digest("hex");
const captureFiles = (source: PageDesignSource, root = process.cwd()) =>
  sourceFiles[source].map((relativePath) => ({
    path: relativePath,
    content: fs.readFileSync(path.join(root, relativePath), "utf8"),
  }));
const blankTests = (): TestResult[] =>
  testNames.map(([id, name, required]) => ({
    id,
    name,
    required,
    state: "not_run",
    summary: "Not run",
  }));

function version(
  design: Pick<PageDesign, "id" | "files" | "settings" | "versions">,
  trigger: DesignVersionTrigger,
  label: string,
  actor: string,
  extra: Partial<DesignVersion> = {},
): DesignVersion {
  return {
    id: randomUUID(),
    designId: design.id,
    versionNumber: design.versions.length + 1,
    label,
    createdAt: new Date().toISOString(),
    createdBy: actor,
    trigger,
    configurationSnapshot: {
      files: clone(design.files),
      layoutNotes: design.settings.layoutNotes,
    },
    ...extra,
  };
}

function normalize(raw: Partial<PageDesign>): PageDesign {
  const files = Array.isArray(raw.files) ? raw.files : [];
  const now = raw.createdAt ?? new Date().toISOString();
  const base: PageDesign = {
    id: raw.id ?? randomUUID(),
    name: raw.name ?? "Untitled Design",
    sourcePage: raw.sourcePage === "admin" ? "admin" : "participant",
    status: raw.status ?? "draft",
    createdAt: now,
    updatedAt: raw.updatedAt ?? now,
    files,
    baselineFiles: raw.baselineFiles ?? clone(files),
    sourceFingerprint: raw.sourceFingerprint ?? fingerprint(files),
    settings: raw.settings ?? { layoutNotes: "", echoBrainSandbox: false },
    aiState: raw.aiState ?? "disabled",
    proposals: raw.proposals ?? [],
    tests: raw.tests ?? blankTests(),
    versions: raw.versions ?? [],
    reviews: raw.reviews ?? [],
    publishRecords: raw.publishRecords ?? [],
    activeProposalId: raw.activeProposalId,
    snapshotWeek: raw.snapshotWeek,
  };
  if (!base.versions.length) {
    base.versions = [version(base, "created", "Design created", "system")];
  }
  return base;
}

function read(root = process.cwd()): PageDesignLibrary {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath(root), "utf8")) as {
      designs?: Partial<PageDesign>[];
    };
    return { version: 2, designs: (raw.designs ?? []).map(normalize) };
  } catch {
    return { version: 2, designs: [] };
  }
}
function write(library: PageDesignLibrary, root = process.cwd()) {
  const target = filePath(root);
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(library, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, target);
}
function find(library: PageDesignLibrary, id: string) {
  const design = library.designs.find((item) => item.id === id);
  if (!design) throw new Error("PAGE_DESIGN_NOT_FOUND");
  return design;
}
function validateFiles(design: PageDesign, files: PageDesignFile[]) {
  const allowed = new Set(sourceFiles[design.sourcePage]);
  return files.map((item) => {
    if (!allowed.has(item.path)) throw new Error("INVALID_DESIGN_FILE");
    return { path: item.path, content: item.content.slice(0, 2_000_000) };
  });
}
function atomicApply(files: PageDesignFile[], root: string, suffix: string) {
  const prepared = files.map((file) => {
    const target = path.resolve(root, file.path);
    if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error("INVALID_DESIGN_FILE");
    const temporary = `${target}.${process.pid}.${suffix}`;
    const backup = fs.readFileSync(target, "utf8");
    fs.writeFileSync(temporary, file.content, "utf8");
    return { target, temporary, backup };
  });
  const committed: typeof prepared = [];
  try {
    for (const item of prepared) {
      fs.renameSync(item.temporary, item.target);
      committed.push(item);
    }
    for (const [index, item] of prepared.entries()) {
      if (fs.readFileSync(item.target, "utf8") !== files[index].content) {
        throw new Error("POST_PUBLISH_HEALTH_CHECK_FAILED");
      }
    }
  } catch (error) {
    for (const item of committed) fs.writeFileSync(item.target, item.backup, "utf8");
    for (const item of prepared) {
      if (fs.existsSync(item.temporary)) fs.unlinkSync(item.temporary);
    }
    throw error;
  }
}
function isoWeek(date = new Date()) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return `${target.getUTCFullYear()}-W${String(Math.ceil(((target.getTime() - start.getTime()) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}
function createCaptured(name: string, sourcePage: PageDesignSource, status: PageDesign["status"], root: string, snapshotWeek?: string) {
  const now = new Date().toISOString();
  const files = captureFiles(sourcePage, root);
  return normalize({
    id: randomUUID(), name: name.slice(0, 120), sourcePage, status,
    createdAt: now, updatedAt: now, files, baselineFiles: clone(files),
    sourceFingerprint: fingerprint(files),
    settings: { layoutNotes: "", echoBrainSandbox: false },
    snapshotWeek,
  });
}

export function ensureWeeklyPageDesignSnapshots(root = process.cwd()) {
  const library = read(root);
  const week = isoWeek();
  let changed = false;
  for (const source of ["admin", "participant"] as const) {
    if (!library.designs.some((d) => d.status === "snapshot" && d.sourcePage === source && d.snapshotWeek === week)) {
      library.designs.unshift(createCaptured(`${source} weekly snapshot ${week}`, source, "snapshot", root, week));
      changed = true;
    }
    for (const old of library.designs
      .filter((d) => d.sourcePage === source && d.status === "snapshot")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(12)) {
      old.status = "archived";
      changed = true;
    }
  }
  if (changed) write(library, root);
  return library.designs;
}
export function getSnapshotStatus(root = process.cwd()) {
  const designs = ensureWeeklyPageDesignSnapshots(root);
  const latest = designs.filter((d) => d.status === "snapshot").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + 7);
  return {
    lastSuccessful: latest?.createdAt ?? null,
    nextScheduled: next.toISOString(),
    status: "scheduler_unavailable" as const,
    pages: ["admin", "participant"] as const,
  };
}
export function createManualSnapshots(root = process.cwd()) {
  const library = read(root);
  const stamp = new Date().toISOString();
  for (const source of ["admin", "participant"] as const) {
    library.designs.unshift(createCaptured(`${source} manual snapshot ${stamp}`, source, "snapshot", root));
  }
  write(library, root);
  return library.designs;
}
export function listPageDesigns(root = process.cwd()) { ensureWeeklyPageDesignSnapshots(root); return read(root).designs; }
export function getPageDesign(id: string, root = process.cwd()) { return find(read(root), id); }
export function createPageDesign(name: string, source: PageDesignSource, root = process.cwd()) {
  const library = read(root);
  const design = createCaptured(name, source, "draft", root);
  library.designs.unshift(design); write(library, root); return design;
}

export type DesignMutation =
  | { action: "rename"; name: string; actor: string }
  | { action: "archive"; actor: string }
  | { action: "save"; layoutNotes: string; files?: PageDesignFile[]; actor: string }
  | { action: "copy"; actor: string }
  | { action: "delete"; actor: string }
  | { action: "enable_ai"; actor: string }
  | { action: "apply_proposal"; proposalId: string; actor: string }
  | { action: "record_tests"; tests: TestResult[]; actor: string }
  | { action: "request_approval"; actor: string }
  | { action: "review"; decision: DesignReview["decision"]; notes?: string; actor: string }
  | { action: "restore_version"; versionId: string; actor: string }
  | { action: "publish"; confirmed: boolean; actor: string }
  | { action: "rollback"; confirmed: boolean; actor: string };

export function addProposal(id: string, proposal: Omit<DesignProposal, "id" | "designId" | "createdAt" | "status">, actor: string, root = process.cwd()) {
  const library = read(root); const design = find(library, id);
  if (!design.settings.echoBrainSandbox) throw new Error("AI_NOT_ENABLED");
  const value: DesignProposal = { ...proposal, id: randomUUID(), designId: id, createdAt: new Date().toISOString(), status: "proposed" };
  design.proposals.unshift(value); design.activeProposalId = value.id; design.aiState = "proposal_ready"; design.updatedAt = value.createdAt;
  void actor; write(library, root); return design;
}

export function mutatePageDesign(id: string, mutation: DesignMutation, root = process.cwd()) {
  const library = read(root); const design = find(library, id); const now = new Date().toISOString();
  if (mutation.action === "delete") { library.designs = library.designs.filter((d) => d.id !== id); write(library, root); return null; }
  if (mutation.action === "copy") {
    const copy = normalize({ ...clone(design), id: randomUUID(), name: `${design.name} Copy`, status: "draft", createdAt: now, updatedAt: now, versions: [], reviews: [], publishRecords: [], snapshotWeek: undefined });
    library.designs.unshift(copy); write(library, root); return copy;
  }
  if (mutation.action === "rename") design.name = mutation.name.trim().slice(0, 120) || design.name;
  if (mutation.action === "archive") {
    if (design.status === "published") throw new Error("INVALID_STATUS_TRANSITION");
    design.status = "archived";
  }
  if (mutation.action === "enable_ai") { design.settings.echoBrainSandbox = true; design.aiState = "ready"; }
  if (mutation.action === "save") {
    design.versions.push(version(design, "manual_save", "Before manual save", mutation.actor));
    design.settings.layoutNotes = mutation.layoutNotes.slice(0, 20_000);
    if (mutation.files) design.files = validateFiles(design, mutation.files);
    design.status = "draft"; design.tests = blankTests();
  }
  if (mutation.action === "apply_proposal") {
    const proposal = design.proposals.find((p) => p.id === mutation.proposalId);
    if (!proposal || proposal.status !== "proposed" || !proposal.proposedFiles) throw new Error("INVALID_PROPOSAL");
    const checkpoint = version(design, "ai_apply", "Before AI proposal", mutation.actor, { proposalId: proposal.id, filesAffected: proposal.filesAffected });
    design.versions.push(checkpoint); design.files = validateFiles(design, proposal.proposedFiles);
    proposal.rollbackSnapshotId = checkpoint.id; proposal.appliedAt = now; proposal.status = "applied";
    design.aiState = "testing"; design.status = "draft"; design.tests = blankTests();
  }
  if (mutation.action === "record_tests") {
    design.versions.push(version(design, "pre_test", "Before tests", mutation.actor));
    design.tests = mutation.tests.map((test) => ({ ...test }));
    const failed = design.tests.some((test) => test.required && test.state !== "passed");
    design.status = failed ? "failed" : "testing"; design.aiState = failed ? "failed" : "awaiting_approval";
  }
  if (mutation.action === "request_approval") {
    if (design.tests.some((t) => t.required && t.state !== "passed")) throw new Error("TESTS_NOT_PASSED");
    design.status = "awaiting_approval";
  }
  if (mutation.action === "review") {
    if (design.status !== "awaiting_approval") throw new Error("INVALID_STATUS_TRANSITION");
    design.reviews.push({ reviewer: mutation.actor, timestamp: now, decision: mutation.decision, notes: mutation.notes?.slice(0, 2000) });
    design.status = mutation.decision === "approved" ? "approved" : "draft";
    const proposal = design.proposals.find((p) => p.id === design.activeProposalId);
    if (proposal) proposal.status = mutation.decision === "approved" ? "approved" : "rejected";
  }
  if (mutation.action === "restore_version") {
    const target = design.versions.find((item) => item.id === mutation.versionId);
    if (!target) throw new Error("VERSION_NOT_FOUND");
    design.versions.push(version(design, "restore", `Before restoring v${target.versionNumber}`, mutation.actor));
    design.files = clone(target.configurationSnapshot.files); design.settings.layoutNotes = target.configurationSnapshot.layoutNotes;
    design.status = "draft"; design.tests = blankTests();
  }
  if (mutation.action === "publish") {
    if (!mutation.confirmed || design.status !== "approved" || design.tests.some((t) => t.required && t.state !== "passed") || design.proposals.some((p) => p.status === "proposed")) throw new Error("PUBLISH_GUARD_FAILED");
    const live = captureFiles(design.sourcePage, root);
    if (fingerprint(live) !== design.sourceFingerprint) throw new Error("PRODUCTION_VERSION_CONFLICT");
    const pre = version({ ...design, files: live }, "pre_publish", "Pre-publish production snapshot", mutation.actor);
    design.versions.push(pre);
    const approved = version(design, "publish", "Published design", mutation.actor);
    design.versions.push(approved);
    try {
      const files = validateFiles(design, design.files);
      atomicApply(files, root, "publish");
      design.publishRecords.push({ publishedAt: now, publishedBy: mutation.actor, versionId: approved.id, prePublishVersionId: pre.id, productionFingerprint: fingerprint(live), status: "published" });
      design.status = "published"; design.sourceFingerprint = fingerprint(design.files);
    } catch (error) {
      design.publishRecords.push({ publishedAt: now, publishedBy: mutation.actor, versionId: approved.id, prePublishVersionId: pre.id, productionFingerprint: fingerprint(live), status: "failed", error: error instanceof Error ? error.message : "publish-failed" });
      write(library, root);
      throw error;
    }
  }
  if (mutation.action === "rollback") {
    if (!mutation.confirmed || design.status !== "published") throw new Error("ROLLBACK_GUARD_FAILED");
    const record = [...design.publishRecords].reverse().find((item) => item.status === "published");
    const prior = record && design.versions.find((item) => item.id === record.prePublishVersionId);
    if (!record || !prior) throw new Error("ROLLBACK_SNAPSHOT_MISSING");
    atomicApply(validateFiles(design, prior.configurationSnapshot.files), root, "rollback");
    design.versions.push(version(design, "rollback", "Production rollback", mutation.actor));
    record.status = "rolled_back"; design.status = "rolled_back";
  }
  design.updatedAt = now; write(library, root); return design;
}
