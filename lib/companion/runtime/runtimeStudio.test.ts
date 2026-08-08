import assert from "node:assert/strict";
import test from "node:test";
import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import type { ActionRequest, ExecutionResult } from "../actions/types.ts";
import { CompanionRuntime } from "./framework.ts";
import { RuntimeScheduler } from "./scheduler.ts";
import type { RuntimeConversationEngine } from "./types.ts";
import { CompanionStudio } from "../studio/studio.ts";
import type { MarketplaceMetadata } from "../studio/types.ts";

const actor: CurrentUserSession = { role: "admin", name: "Runtime Test" };
const page = { pageId: "/admin", pageType: "admin" as const, locale: "en" as const };
const action: ActionRequest = { requestId: "request-1", actionId: "OpenDashboard", category: "navigation", parameters: {}, confidence: 1, requiresConfirmation: false, reason: "Open dashboard" };

class FakeConversation implements RuntimeConversationEngine {
  ended = false;
  failNext = false;
  createSession() { return { sessionId: "runtime-session", pageId: "/admin", pageType: "admin" as const, locale: "en" as const, startedAt: new Date().toISOString(), lastActivity: new Date().toISOString(), activeInput: "text" as const, activeOutput: "text" as const, state: "active" as const, temporaryMemory: { previousQuestions: [] }, messages: [] }; }
  async process() { if (this.failNext) { this.failNext = false; throw new Error("TEMPORARY_RUNTIME_FAILURE"); } return { synchronized: true }; }
  async executeAction(): Promise<ExecutionResult> { return { requestId: action.requestId, actionId: action.actionId, status: "success", success: true, message: "Ready", durationMs: 1, completedAt: new Date().toISOString() }; }
  prepareSpeech() { return { speech: true }; }
  endSession() { this.ended = true; }
}

const metadata: MarketplaceMetadata = {
  slug: "support-companion",
  title: "Support Companion",
  description: "A reusable support companion.",
  author: "DekoKraft",
  version: "1.0.0",
  tags: ["support", "enterprise"],
  license: "commercial",
  visibility: "public",
  publishingStatus: "draft",
};

const configuredBuilder = (studio: CompanionStudio) => {
  const builder = studio.createBuilder();
  builder.assistant.configureBrain({ providerId: "echobrain" }).configureSkills(["support", "knowledge"]).configurePermissions(["knowledge.view"]).configureCharacter("professional").configure({ locale: "en", safeMode: true });
  builder.avatar.configureAvatar("companion-professional").configureVoice("professional-voice").configureExpressions(["neutral", "happy"]).configureAnimations(["idle", "speaking"]).configureVisualIdentity({ primaryColor: "#111111", accentColor: "#cc8800" });
  return builder;
};

test("Runtime lifecycle enforces boot, active work, sleep, wake and shutdown transitions", async () => {
  const fake = new FakeConversation();
  const runtime = new CompanionRuntime(fake);
  assert.equal(runtime.state.state, "Shutdown");
  assert.equal(runtime.engine.boot(actor, page).state, "Idle");
  assert.deepEqual(await runtime.engine.submit("Hello"), { synchronized: true });
  assert.equal(runtime.state.state, "Idle");
  assert.equal((await runtime.engine.execute(action)).status, "success");
  assert.deepEqual(runtime.engine.prepareSpeech(), { speech: true });
  assert.equal(runtime.engine.sleep().state, "Sleeping");
  assert.equal(runtime.engine.wake().state, "Idle");
  assert.equal(runtime.engine.shutdown().state, "Shutdown");
  assert.equal(fake.ended, true);
});

test("runtime synchronizes state events, performance metrics and recoverable errors", async () => {
  const fake = new FakeConversation();
  const runtime = new CompanionRuntime(fake);
  runtime.engine.boot(actor, page);
  fake.failNext = true;
  await assert.rejects(() => runtime.engine.submit("Fail once"), /TEMPORARY_RUNTIME_FAILURE/);
  assert.equal(runtime.state.state, "Idle");
  assert.ok(runtime.engine.dispatcher.history().some(event => event.type === "recovered"));
  assert.equal(runtime.engine.performance.snapshot().at(-1)?.success, false);
});

test("RuntimeScheduler executes due tasks by time and priority exactly once", async () => {
  const scheduler = new RuntimeScheduler();
  const completed: string[] = [];
  scheduler.schedule({ name: "later", dueAt: 200, priority: 1, run: async () => { completed.push("later"); } });
  scheduler.schedule({ name: "urgent", dueAt: 100, priority: 10, run: async () => { completed.push("urgent"); } });
  assert.equal((await scheduler.runDue(150)).length, 1);
  assert.deepEqual(completed, ["urgent"]);
  assert.equal((await scheduler.runDue(300)).length, 1);
  assert.deepEqual(completed, ["urgent", "later"]);
  assert.equal((await scheduler.runDue(300)).length, 0);
});

test("Assistant and Avatar wizards generate a complete reusable companion package", () => {
  const studio = new CompanionStudio();
  const companionPackage = configuredBuilder(studio).build(metadata, "enterprise");
  assert.equal(companionPackage.brain.providerId, "echobrain");
  assert.deepEqual(companionPackage.skills, ["support", "knowledge"]);
  assert.equal(companionPackage.character, "professional");
  assert.equal(companionPackage.avatar, "companion-professional");
  assert.equal(companionPackage.voice, "professional-voice");
  assert.equal(companionPackage.templateType, "enterprise");
});

test("package export and import preserve content and reject tampering", () => {
  const studio = new CompanionStudio();
  const companionPackage = configuredBuilder(studio).build(metadata);
  const exported = studio.export(companionPackage);
  assert.deepEqual(studio.import(exported), companionPackage);
  const tampered = exported.replace("Support Companion", "Unsafe Companion");
  assert.throws(() => studio.import(tampered), /CHECKSUM_MISMATCH/);
});

test("package clone, share and marketplace publishing produce isolated metadata", () => {
  const studio = new CompanionStudio();
  const source = configuredBuilder(studio).build(metadata, "marketplace");
  const clone = studio.clone(source);
  assert.notEqual(clone.packageId, source.packageId);
  assert.equal(clone.metadata.publishingStatus, "draft");
  assert.equal(source.metadata.title, "Support Companion");
  const share = studio.share(source);
  assert.equal(share.packageId, source.packageId);
  const publishing = studio.prepareMarketplacePublishing(source);
  assert.equal(publishing.metadata.publishingStatus, "pending_review");
  assert.equal(source.metadata.publishingStatus, "draft");
});

