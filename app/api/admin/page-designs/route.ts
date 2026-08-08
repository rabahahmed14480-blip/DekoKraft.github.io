import { participantAccessResponse, requireAdminSession } from "../../../../lib/auth/participantAccess";
import { trackPageDesignEvent } from "../../../../lib/page-designs/analytics";
import { echoBrainDesignAdapter } from "../../../../lib/page-designs/echobrain";
import { pageDesignPermissionSet, requirePageDesignPermission } from "../../../../lib/page-designs/permissions";
import {
  addProposal, createManualSnapshots, createPageDesign, getPageDesign,
  getSnapshotStatus, listPageDesigns, mutatePageDesign,
} from "../../../../lib/page-designs/store";
import { runDesignTests } from "../../../../lib/page-designs/testRunner";
import { workspaceImpact } from "../../../../lib/page-designs/networkStore";
import type { PageDesignFile, PageDesignSource } from "../../../../lib/page-designs/types";

const isSource = (value: unknown): value is PageDesignSource => value === "admin" || value === "participant";
const actorName = (session: { name?: string }) => session.name || "Admin";
const files = (value: unknown) => Array.isArray(value)
  ? value.filter((file): file is PageDesignFile => Boolean(file) && typeof file === "object" && typeof (file as PageDesignFile).path === "string" && typeof (file as PageDesignFile).content === "string")
  : undefined;

export async function GET(request: Request) {
  try {
    const session = await requireAdminSession();
    requirePageDesignPermission(session, "page_designs.view");
    const id = new URL(request.url).searchParams.get("id");
    if (id) trackPageDesignEvent("design_workspace_opened", { designId: id });
    return Response.json({
      design: id ? getPageDesign(id) : undefined,
      designs: id ? undefined : listPageDesigns(),
      permissions: [...pageDesignPermissionSet(session)],
      snapshotStatus: getSnapshotStatus(),
      echoBrainAvailable: echoBrainDesignAdapter.available,
    });
  } catch (error) { return participantAccessResponse(error); }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const actor = actorName(session);
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "create") {
      requirePageDesignPermission(session, "page_designs.create");
      if (!isSource(body.sourcePage)) return Response.json({ error: "invalid-source-page" }, { status: 400 });
      return Response.json({ design: createPageDesign(typeof body.name === "string" ? body.name : "Untitled Design", body.sourcePage) });
    }
    if (body.action === "manual_snapshot") {
      requirePageDesignPermission(session, "page_designs.manage_snapshots");
      return Response.json({ designs: createManualSnapshots() });
    }
    if (typeof body.id !== "string") return Response.json({ error: "design-id-required" }, { status: 400 });
    const id = body.id;
    if (body.action === "analyze") {
      requirePageDesignPermission(session, "page_designs.use_ai");
      trackPageDesignEvent("ai_request_submitted", { designId: id });
      if (!echoBrainDesignAdapter.available) return Response.json({ error: "ECHOBRAIN_DESIGN_BACKEND_UNAVAILABLE" }, { status: 503 });
      const impact = workspaceImpact(id);
      if (!impact) return Response.json({ error: "DESIGN_SCOPE_REQUIRED" }, { status: 400 });
      const proposal = await echoBrainDesignAdapter.analyze({
        design: getPageDesign(id),
        prompt: String(body.prompt ?? ""),
        targetScope: impact.scope,
        calculatedImpact: {
          affectedParticipantCount: impact.count,
          affectedPages: [impact.scope.type === "admin_page" ? "admin" : "participant"],
          affectedSections: impact.scope.sectionIds,
          inheritanceLevel: impact.scope.type,
          rollbackTarget: impact.scope.participantId ? `participant:${impact.scope.participantId}` : impact.scope.type,
        },
      });
      const design = addProposal(id, proposal, actor);
      trackPageDesignEvent("proposal_received", { designId: id });
      return Response.json({ design });
    }
    if (body.action === "run_tests") {
      requirePageDesignPermission(session, "page_designs.test");
      trackPageDesignEvent("tests_started", { designId: id });
      const results = runDesignTests(getPageDesign(id));
      const design = mutatePageDesign(id, { action: "record_tests", tests: results, actor });
      trackPageDesignEvent(results.some((item) => item.required && item.state !== "passed") ? "tests_failed" : "tests_passed", { designId: id });
      return Response.json({ design });
    }
    if (body.action === "save") {
      requirePageDesignPermission(session, "page_designs.edit");
      return Response.json({ design: mutatePageDesign(id, { action: "save", layoutNotes: String(body.layoutNotes ?? ""), files: files(body.files), actor }) });
    }
    if (body.action === "rename") {
      requirePageDesignPermission(session, "page_designs.edit");
      return Response.json({ design: mutatePageDesign(id, { action: "rename", name: String(body.name ?? ""), actor }) });
    }
    if (body.action === "copy") {
      requirePageDesignPermission(session, "page_designs.create");
      return Response.json({ design: mutatePageDesign(id, { action: "copy", actor }) });
    }
    if (body.action === "archive") {
      requirePageDesignPermission(session, "page_designs.archive");
      return Response.json({ design: mutatePageDesign(id, { action: "archive", actor }) });
    }
    if (body.action === "delete") {
      requirePageDesignPermission(session, "page_designs.archive");
      return Response.json({ design: mutatePageDesign(id, { action: "delete", actor }) });
    }
    if (body.action === "enable_ai") {
      requirePageDesignPermission(session, "page_designs.use_ai");
      trackPageDesignEvent("ai_enabled", { designId: id });
      return Response.json({ design: mutatePageDesign(id, { action: "enable_ai", actor }) });
    }
    if (body.action === "apply_proposal") {
      requirePageDesignPermission(session, "page_designs.edit");
      const design = mutatePageDesign(id, { action: "apply_proposal", proposalId: String(body.proposalId ?? ""), actor });
      trackPageDesignEvent("proposal_applied", { designId: id });
      return Response.json({ design });
    }
    if (body.action === "request_approval") {
      requirePageDesignPermission(session, "page_designs.review");
      const design = mutatePageDesign(id, { action: "request_approval", actor });
      trackPageDesignEvent("approval_requested", { designId: id });
      return Response.json({ design });
    }
    if (body.action === "review") {
      requirePageDesignPermission(session, "page_designs.approve");
      const decision = body.decision === "approved" || body.decision === "rejected" || body.decision === "changes_requested" ? body.decision : "changes_requested";
      const design = mutatePageDesign(id, { action: "review", decision, notes: typeof body.notes === "string" ? body.notes : undefined, actor });
      trackPageDesignEvent(decision === "approved" ? "design_approved" : "design_rejected", { designId: id });
      return Response.json({ design });
    }
    if (body.action === "restore_version") {
      requirePageDesignPermission(session, "page_designs.edit");
      const design = mutatePageDesign(id, { action: "restore_version", versionId: String(body.versionId ?? ""), actor });
      trackPageDesignEvent("version_restored", { designId: id });
      return Response.json({ design });
    }
    if (body.action === "publish") {
      requirePageDesignPermission(session, "page_designs.publish");
      trackPageDesignEvent("publish_started", { designId: id });
      const design = mutatePageDesign(id, { action: "publish", confirmed: body.confirmed === true, actor });
      trackPageDesignEvent("publish_succeeded", { designId: id });
      return Response.json({ design });
    }
    if (body.action === "rollback") {
      requirePageDesignPermission(session, "page_designs.rollback");
      trackPageDesignEvent("rollback_started", { designId: id });
      const design = mutatePageDesign(id, { action: "rollback", confirmed: body.confirmed === true, actor });
      trackPageDesignEvent("rollback_completed", { designId: id });
      return Response.json({ design });
    }
    return Response.json({ error: "invalid-action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "page-design-command-failed";
    if (message.startsWith("PAGE_DESIGN_") || message.includes("NOT_") || message.includes("INVALID_") || message.includes("GUARD_") || message.includes("CONFLICT") || message.includes("SNAPSHOT")) {
      return Response.json({ error: message }, { status: message.includes("PERMISSION") ? 403 : 400 });
    }
    return participantAccessResponse(error);
  }
}
