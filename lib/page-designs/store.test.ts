import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  addProposal,
  createPageDesign,
  getPageDesign,
  mutatePageDesign,
  sourceFiles,
} from "./store.ts";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "page-designs-"));
  for (const files of Object.values(sourceFiles)) {
    for (const file of files) {
      const target = path.join(root, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (!fs.existsSync(target)) fs.writeFileSync(target, `production:${file}`);
    }
  }
  return root;
}
const actor = "Test Admin";

test("drafts and proposals remain isolated from production and one another", () => {
  const root = fixture();
  const first = createPageDesign("One", "admin", root);
  const second = createPageDesign("Two", "admin", root);
  const productionPath = path.join(root, first.files[0].path);
  const production = fs.readFileSync(productionPath, "utf8");
  mutatePageDesign(first.id, { action: "enable_ai", actor }, root);
  const proposedFiles = structuredClone(first.files);
  proposedFiles[0].content = "isolated proposal";
  const withProposal = addProposal(first.id, {
    prompt: "change",
    summary: "Safe test proposal",
    filesAffected: [proposedFiles[0].path],
    componentsAffected: ["Admin"],
    risks: ["visual"],
    requiredTests: ["typecheck"],
    proposedFiles,
  }, actor, root);
  assert.equal(fs.readFileSync(productionPath, "utf8"), production);
  mutatePageDesign(first.id, { action: "apply_proposal", proposalId: withProposal.proposals[0].id, actor }, root);
  assert.equal(getPageDesign(first.id, root).files[0].content, "isolated proposal");
  assert.equal(getPageDesign(second.id, root).files[0].content, production);
  assert.equal(fs.readFileSync(productionPath, "utf8"), production);
});

test("approval and publish guards enforce required tests", () => {
  const root = fixture();
  const design = createPageDesign("Guarded", "participant", root);
  assert.throws(() => mutatePageDesign(design.id, { action: "request_approval", actor }, root), /TESTS_NOT_PASSED/);
  assert.throws(() => mutatePageDesign(design.id, { action: "publish", confirmed: true, actor }, root), /PUBLISH_GUARD_FAILED/);
  const failed = design.tests.map((item) => ({ ...item, state: item.required ? "failed" as const : "skipped" as const }));
  mutatePageDesign(design.id, { action: "record_tests", tests: failed, actor }, root);
  assert.throws(() => mutatePageDesign(design.id, { action: "request_approval", actor }, root), /TESTS_NOT_PASSED/);
});

test("rollback restores production and version snapshots remain immutable", () => {
  const root = fixture();
  const design = createPageDesign("Publish", "admin", root);
  const original = design.files[0].content;
  const changed = structuredClone(design.files);
  changed[0].content = "approved production";
  mutatePageDesign(design.id, { action: "save", files: changed, layoutNotes: "", actor }, root);
  const current = getPageDesign(design.id, root);
  const passed = current.tests.map((item) => ({ ...item, state: item.required ? "passed" as const : "skipped" as const }));
  mutatePageDesign(design.id, { action: "record_tests", tests: passed, actor }, root);
  mutatePageDesign(design.id, { action: "request_approval", actor }, root);
  mutatePageDesign(design.id, { action: "review", decision: "approved", actor }, root);
  const immutableSnapshot = structuredClone(getPageDesign(design.id, root).versions[0]);
  mutatePageDesign(design.id, { action: "publish", confirmed: true, actor }, root);
  assert.equal(fs.readFileSync(path.join(root, design.files[0].path), "utf8"), "approved production");
  mutatePageDesign(design.id, { action: "rollback", confirmed: true, actor }, root);
  assert.equal(fs.readFileSync(path.join(root, design.files[0].path), "utf8"), original);
  assert.deepEqual(getPageDesign(design.id, root).versions[0], immutableSnapshot);
});
