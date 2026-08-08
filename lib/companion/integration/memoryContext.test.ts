import assert from "node:assert/strict";
import test from "node:test";
import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import { ContextWindowManager } from "../context/windowManager.ts";
import { ConversationEngine } from "../conversationEngine.ts";
import { ConversationManager } from "../conversationManager.ts";
import { SessionMemoryManager } from "../memory/manager.ts";
import { PageContextResolver } from "../page-context/resolver.ts";

const actor: CurrentUserSession = { role: "admin", name: "Phase Four", email: "phase4@example.test" };

test("conversation context preserves continuity, page awareness, user context and selected companion", async () => {
  const engine = new ConversationEngine(new ConversationManager());
  const session = engine.createSession(actor, { pageId: "/welcome", pageType: "public", locale: "en" });
  await engine.process(actor, { sessionId: session.sessionId, text: "Explain this page" });
  const second = await engine.process(actor, { sessionId: session.sessionId, text: "Continue", pageContext: { pageId: "/about" } });
  const context = second.reasoning.conversationContext;
  assert.equal(context.page.route, "/about");
  assert.equal(context.userContext.email, actor.email);
  assert.ok(context.selectedCompanion.id);
  assert.ok(context.conversation.some(message => message.text === "Explain this page"));
  assert.equal(Object.isFrozen(context), true);
});

test("memory operations support persistent, protected, expiring, summarization and compression", () => {
  let now = Date.parse("2026-07-30T10:00:00.000Z");
  const page = new PageContextResolver().resolve({ route: "/welcome", pageType: "home", language: "en" });
  const manager = new SessionMemoryManager({ now: () => now, entryTtlMs: 100 });
  const events: string[] = [];
  manager.subscribe(event => events.push(event.type));
  manager.start("one", page, "user");
  manager.save("one", { key: "language", value: "de", type: "persistent" });
  manager.save("one", { key: "safety", value: true, type: "protected" });
  manager.save("one", { key: "temporary", value: "soon gone", type: "expiring", ttlMs: 50 });
  manager.rememberTurn("one", { question: "What did I prefer?", answer: "German." });
  assert.match(manager.summarize("one"), /What did I prefer/);
  assert.ok(manager.compress("one").remainingEntries >= 0);
  assert.throws(() => manager.forget("one", "safety"), /PROTECTED_MEMORY/);
  manager.clear("one");
  manager.start("two", page, "user");
  assert.equal(manager.load("two", "language")?.value, "de");
  now += 60;
  assert.equal(manager.load("two", "temporary"), undefined);
  assert.ok(events.includes("MemoryLoaded"));
  assert.ok(events.includes("MemoryUpdated"));
  assert.ok(events.includes("MemorySummarized"));
});

test("context window emits ContextExpired when old conversation is removed", () => {
  const windows = new ContextWindowManager({ maxMessages: 1 });
  const events: string[] = [];
  windows.subscribe(event => events.push(event.type));
  const base = { timestamp: new Date().toISOString(), messageType: "text" as const, metadata: {}, processingState: "completed" as const };
  const fitted = windows.fit("session", [
    { ...base, id: "one", sender: "user", text: "first" },
    { ...base, id: "two", sender: "companion", text: "second" },
  ]);
  assert.deepEqual(fitted.map(message => message.id), ["two"]);
  assert.deepEqual(events, ["ContextExpired"]);
});
