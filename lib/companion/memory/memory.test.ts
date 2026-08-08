import assert from "node:assert/strict";
import test from "node:test";
import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import { ConversationEngine } from "../conversationEngine.ts";
import { ConversationManager } from "../conversationManager.ts";
import { PageContextResolver } from "../page-context/resolver.ts";
import { MemoryCleaner } from "./cleaner.ts";
import { SessionMemoryManager } from "./manager.ts";
import { MemoryResolver } from "./resolver.ts";

const contexts = new PageContextResolver();
const productContext = (route = "/products/box") => contexts.resolve({
  route, pageType: "product", language: "en", permissions: { canPurchase: true, canShare: true },
  entity: { id: "internal-product-id", type: "product", displayName: "Wooden Box", status: "active", visibility: "public" },
  selectedObject: { id: "internal-layer-id", type: "image", displayName: "Main image" },
});

test("entity, topic, question, answer, selection and intent stay in lightweight session memory", () => {
  const manager = new SessionMemoryManager({ maxEntries: 12 });
  manager.start("session", productContext());
  manager.rememberTurn("session", { question: "Explain this product", answer: "It is a wooden box.", topic: "wooden-box" });
  const memory = manager.current("session");
  assert.equal(memory.currentIntent, "learn");
  assert.equal(memory.state.currentTopic, "wooden-box");
  assert.ok(memory.entries.some(entry => entry.type === "entity"));
  assert.ok(memory.entries.some(entry => entry.type === "selection"));
  assert.ok(memory.entries.some(entry => entry.type === "question"));
  assert.ok(memory.entries.some(entry => entry.type === "answer"));
  assert.ok(memory.entries.length <= 12);
  assert.equal(JSON.stringify(memory).includes("internal-product-id"), false);
});

test("reference and comparison resolution supports current, previous, first and second", () => {
  const manager = new SessionMemoryManager();
  manager.start("session", productContext());
  manager.rememberTurn("session", { question: "Compare products", answer: "Ready to compare." });
  manager.rememberComparison("session", [{ displayName: "Product A", price: 10 }, { displayName: "Product B", price: 20 }]);
  const first = manager.resolveReferences("session", "Explain the first");
  const second = manager.resolveReferences("session", "Compare it with the second");
  assert.equal((first[0].value as { displayName: string }).displayName, "Product A");
  assert.ok(second.some(item => (item.value as { displayName?: string }).displayName === "Product B"));
  assert.ok(second.some(item => item.expression === "current"));
});

test("workspace and reading memory retain only current structured progress", () => {
  const context = contexts.resolve({ route: "/studio", pageType: "design_workspace", language: "en", permissions: { canEdit: true }, workspace: { id: "private-workspace-id", name: "Design Studio", currentTool: "select", currentSelection: "Layer 2", editingMode: "edit", readOnly: false } });
  const manager = new SessionMemoryManager();
  manager.start("workspace", context);
  manager.rememberReading("workspace", { section: "Instructions", paragraph: 3, progress: 42, resumePosition: 180 });
  const memory = manager.current("workspace");
  assert.ok(memory.entries.some(entry => entry.type === "workspace"));
  assert.ok(memory.entries.some(entry => entry.type === "reading"));
  assert.equal(JSON.stringify(memory).includes("private-workspace-id"), false);
});

test("expiration and cleaner remove old, duplicate and sensitive content", () => {
  let now = Date.parse("2026-01-01T00:00:00.000Z");
  const events: string[] = [];
  const manager = new SessionMemoryManager({ ttlMs: 1000, entryTtlMs: 300, maxEntries: 5, now: () => now });
  manager.subscribe(event => events.push(event.type));
  manager.start("expiring", productContext());
  manager.rememberTurn("expiring", { question: "password: never-store-this", answer: "card 4111 1111 1111 1111" });
  const serialized = JSON.stringify(manager.current("expiring"));
  assert.equal(serialized.includes("never-store-this"), false);
  assert.equal(serialized.includes("4111"), false);
  now += 400;
  assert.equal(manager.current("expiring").entries.some(entry => entry.type === "question"), false);
  now += 700;
  manager.cleanExpired();
  assert.equal(manager.count(), 0);
  assert.ok(events.includes("MemoryExpired"));
  const cleaner = new MemoryCleaner();
  assert.deepEqual(cleaner.sanitize({ password: "x", safe: "yes" }), { safe: "yes" });
});

test("page and workspace changes reset memory while selection changes do not", () => {
  const manager = new SessionMemoryManager();
  manager.start("navigation", productContext());
  manager.rememberTurn("navigation", { question: "Explain this", answer: "Answer" });
  const selectionChanged = contexts.resolve({ route: "/products/box", pageType: "product", language: "en", permissions: { canPurchase: true }, selectedObject: { type: "image", displayName: "Alternate image" } });
  manager.syncContext("navigation", selectionChanged);
  assert.ok(manager.current("navigation").entries.some(entry => entry.type === "question"));
  manager.syncContext("navigation", productContext("/products/candle"));
  assert.equal(manager.current("navigation").entries.some(entry => entry.type === "question"), false);
  const workspaceA = contexts.resolve({ route: "/studio", pageType: "design_workspace", language: "en", workspace: { name: "A", editingMode: "edit", readOnly: false } });
  const workspaceB = contexts.resolve({ route: "/studio", pageType: "design_workspace", language: "en", workspace: { name: "B", editingMode: "edit", readOnly: false } });
  const workspaceManager = new SessionMemoryManager();
  workspaceManager.start("workspace", workspaceA);
  workspaceManager.rememberTurn("workspace", { question: "Design this", answer: "Answer" });
  workspaceManager.syncContext("workspace", workspaceB);
  assert.equal(workspaceManager.current("workspace").entries.some(entry => entry.type === "question"), false);
});

test("intent detection covers learn, purchase, design, compare, search, configure, read and help", () => {
  const resolver = new MemoryResolver();
  assert.deepEqual(["Explain this", "buy this", "design colors", "compare A", "search products", "configure settings", "read page", "help me"].map(text => resolver.detectIntent(text)), ["learn", "purchase", "design", "compare", "search", "configure", "read", "request_help"]);
});

test("inaccessible entities are not remembered", () => {
  const privateContext = contexts.resolve({ route: "/admin/report", pageType: "reports", language: "en", permissions: { canViewAdmin: false }, entity: { type: "report", displayName: "Private report", visibility: "admin" } });
  const manager = new SessionMemoryManager();
  manager.start("secure", privateContext);
  assert.equal(manager.current("secure").entries.some(entry => entry.type === "entity"), false);
});

test("Conversation Engine connects memory, references, page resets and explicit clearing", async () => {
  const actor: CurrentUserSession = { role: "admin", name: "Memory Test" };
  const engine = new ConversationEngine(new ConversationManager());
  const session = engine.createSession(actor, { pageId: "/admin", pageType: "admin", locale: "en" });
  await engine.process(actor, { sessionId: session.sessionId, text: "Explain this page" });
  assert.equal(engine.readCurrentIntent(actor, session.sessionId), "learn");
  assert.ok(engine.readCurrentTopic(actor, session.sessionId));
  assert.ok(engine.readRecentMemory(actor, session.sessionId).length > 0);
  engine.clearMemory(actor, session.sessionId);
  assert.equal(engine.readCurrentMemory(actor, session.sessionId).entries.some(entry => entry.type === "question"), false);
  await engine.process(actor, { sessionId: session.sessionId, text: "Help", pageContext: { pageId: "/admin/settings" } });
  assert.equal(engine.readCurrentMemory(actor, session.sessionId).route, "/admin/settings");
  engine.endSession(actor, session.sessionId);
  assert.throws(() => engine.readCurrentMemory(actor, session.sessionId));
});

test("indexed bounded memory remains fast under repeated updates", () => {
  const manager = new SessionMemoryManager({ maxEntries: 20 });
  manager.start("performance", productContext());
  const started = performance.now();
  for (let index = 0; index < 1000; index += 1) manager.rememberComparison("performance", [index, index + 1]);
  const elapsed = performance.now() - started;
  assert.ok(manager.current("performance").entries.length <= 20);
  assert.ok(elapsed < 1500, `memory updates took ${elapsed}ms`);
});
