import assert from "node:assert/strict";
import test from "node:test";
import { ConversationUIController } from "./controller.ts";
import type { ConversationMessage, ConversationSession } from "../types.ts";
import type { ConversationTransport, ConversationUIEvent } from "./types.ts";

const sessions = new Map<string, ConversationSession>();
let sequence = 0;
const message = (sender: ConversationMessage["sender"], text: string): ConversationMessage => ({
  id: `message-${++sequence}`, sender, text, timestamp: new Date().toISOString(), messageType: "text", metadata: {}, processingState: "completed",
});
const transport: ConversationTransport = {
  async createSession(page) { const session: ConversationSession = { sessionId: `session-${++sequence}`, pageId: page.pageId, pageType: page.pageType, locale: page.locale, startedAt: new Date().toISOString(), lastActivity: new Date().toISOString(), activeInput: "text", activeOutput: "text", state: "active", temporaryMemory: { previousQuestions: [] }, messages: [] }; sessions.set(session.sessionId, session); return structuredClone(session); },
  async loadSession(id) { const session = sessions.get(id); if (!session) throw new Error("missing"); return structuredClone(session); },
  async submit(id, text) { const session = sessions.get(id); if (!session) throw new Error("missing"); session.messages.push(message("user", text), message("companion", `Reply: ${text}`)); return { session: structuredClone(session), output: { suggestions: ["Next"] }, companionMessage: session.messages.at(-1) }; },
  async endSession(id) { sessions.delete(id); },
  async prepareSpeech() { return { providerConfigured: false }; },
  async executeAction(_sessionId, request) { return { requestId: request.requestId, actionId: request.actionId, status: "success", success: true, message: "Done", output: { directive: "navigate", href: "/home" }, durationMs: 1, completedAt: new Date().toISOString() }; },
};

const create = (events: ConversationUIEvent[] = []) => new ConversationUIController({
  transport, page: { pageId: "/settings", pageType: "participant", locale: "ar" }, analytics: event => events.push(event),
});

test("controller synchronizes surface modes and one active session without duplicate messages", async () => {
  const controller = create();
  await controller.initialize();
  const sessionId = controller.snapshot().sessionId;
  controller.setSurface("docked");
  controller.setSurface("page");
  assert.equal(controller.snapshot().sessionId, sessionId);
  controller.setDraft("  Help me  ");
  await Promise.all([controller.submit(), controller.submit()]);
  assert.equal(controller.snapshot().messages.length, 2);
  assert.equal(controller.snapshot().messages[0].text, "Help me");
});

test("typed multiline input, partial transcript review, cancellation, suggestions, and accompaniment work", async () => {
  const events: ConversationUIEvent[] = [];
  const controller = create(events);
  await controller.initialize();
  controller.setDraft("Line one\n  Line two");
  await controller.submit();
  assert.equal(controller.snapshot().messages[0].text, "Line one\n  Line two");
  controller.receivePartialTranscript("مرح");
  assert.equal(controller.snapshot().partialTranscript, "مرح");
  controller.finalizeTranscript("مرحبا");
  assert.equal(controller.snapshot().draftText, "مرحبا");
  assert.equal(controller.snapshot().messages.length, 2);
  controller.cancelMicrophone();
  controller.chooseAccompaniment("enabled");
  assert.equal(controller.snapshot().accompanimentMode, "enabled");
  await controller.selectSuggestion("اشرح هذه الصفحة");
  assert.ok(events.includes("suggestion_selected"));
});

test("voice and speech stay honest when no provider is configured and written response remains", async () => {
  const controller = create();
  await controller.initialize();
  await controller.submit("Help");
  const written = controller.snapshot().messages.at(-1);
  assert.ok(written);
  await controller.startMicrophone();
  assert.equal(controller.snapshot().microphoneState, "unavailable");
  await controller.playSpeech(written!);
  assert.equal(controller.snapshot().isSpeaking, false);
  assert.equal(controller.snapshot().messages.at(-1)?.text, written?.text);
});

test("context suggestions, trusted actions, RTL and LTR state are provider independent", async () => {
  const controller = create();
  assert.deepEqual(controller.snapshot().suggestions, ["اشرح هذه الإعدادات", "ما الخيار المناسب؟", "افتح الإعدادات"]);
  assert.equal(controller.validateAction({ id: "safe", label: "Settings", type: "navigate", target: "/participant/settings" }), true);
  assert.equal(controller.validateAction({ id: "unsafe", label: "Outside", type: "navigate", target: "https://example.com" }), false);
  controller.setPageContext({ pageId: "/market/product", pageType: "public", locale: "en" });
  assert.equal(controller.snapshot().currentPageContext.locale, "en");
  assert.ok(controller.snapshot().suggestions.includes("Explain this product"));
});
