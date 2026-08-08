import assert from "node:assert/strict";
import test from "node:test";
import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import { ConversationEngine } from "../conversationEngine.ts";
import { ConversationManager } from "../conversationManager.ts";
import { ReadingService } from "../readingService.ts";
import { ContextChangeDetector } from "./changeDetector.ts";
import { PageContextProvider } from "./provider.ts";
import { pageContextRegistry } from "./registry.ts";
import { PageContextResolver } from "./resolver.ts";
import { ContextSerializer } from "./serializer.ts";
import { ContextValidator } from "./validator.ts";
import type { PageContextAction, RegisteredPageType } from "./types.ts";

const resolver = new PageContextResolver();
const allTypes: RegisteredPageType[] = ["home","landing","product","product_category","design_workspace","project","shopping_cart","checkout","knowledge_article","blog","user_profile","organization","dashboard","settings","administration","reports","search_results","support","help","not_found"];

test("all supported page types are registered and future registrations remain possible", () => {
  const registered = new Set(pageContextRegistry.list().map(item => item.type));
  for (const type of allTypes) assert.equal(registered.has(type), true, type);
});

test("resolver extracts safe entity, sections, workspace, search, selection and permission-aware actions", () => {
  const actions: PageContextAction[] = [
    { id: "edit", label: "Edit", capability: "canEdit", kind: "edit", target: "/participant/settings" },
    { id: "delete", label: "Delete", capability: "canDelete", kind: "delete", target: "/admin/private" },
  ];
  const snapshot = resolver.resolve({
    route: "/participant/settings", language: "ar", title: "<b>الإعدادات</b>",
    permissions: { canEdit: true, canDelete: false, hiddenAdminCapability: true },
    actions, entity: { id: "private-entity-id", type: "user", displayName: "Visible user", visibility: "participant" },
    visibleSections: [{ id: "overview", title: "Overview", content: "<button>Hidden</button> Visible details", readingOrder: 1 }],
    selectedObject: { id: "layer-secret-id", type: "component", displayName: "Header" },
    workspace: { id: "workspace-secret", name: "Brand Studio", currentTool: "select", editingMode: "edit", readOnly: false },
    search: { text: "candles", filters: { status: "active" }, sort: "newest", currentPage: 1, resultCount: 4 },
    metadata: { publicCount: 4, apiToken: "never", privateNotes: "never" },
  });
  assert.equal(snapshot.pageType, "settings");
  assert.equal(snapshot.entity?.id, undefined);
  assert.equal(snapshot.selectedObject?.id, undefined);
  assert.equal(snapshot.workspace?.id, undefined);
  assert.deepEqual(snapshot.actions.map(item => item.id), ["edit"]);
  assert.equal("apiToken" in snapshot.metadata, false);
  assert.equal("privateNotes" in snapshot.metadata, false);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.ok(snapshot.summary.some(item => item.includes("editable")));
});

test("validator excludes hidden routes and unsafe metadata while serializer is immutable and deterministic", () => {
  const validator = new ContextValidator();
  assert.deepEqual(validator.filterActions([{ id: "bad", label: "Bad", capability: "canEdit", kind: "edit", target: "https://evil.example" }], { canEdit: true }), []);
  assert.deepEqual(validator.sanitizeMetadata({ visible: "yes", accessToken: "no" }), { visible: "yes" });
  const first = resolver.resolve({ route: "/help", language: "en" });
  const second = resolver.resolve({ route: "/help", language: "en" });
  assert.equal(first, second);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.throws(() => { (first as { title: string }).title = "changed"; }, TypeError);
  assert.ok(new ContextSerializer().toConversationPayload(first));
});

test("change detection reports route, entity, selection, workspace, permissions and search changes", () => {
  const detector = new ContextChangeDetector();
  const previous = resolver.resolve({ route: "/market?q=box", language: "en", pageType: "search_results", permissions: { canPurchase: true }, search: { text: "box", filters: {}, currentPage: 1, resultCount: 2 } });
  const current = resolver.resolve({ route: "/market?q=candle", language: "en", pageType: "search_results", permissions: { canPurchase: false }, selectedObject: { type: "product", displayName: "Candle" }, workspace: { name: "Compare", editingMode: "view", readOnly: true }, search: { text: "candle", filters: { color: "blue" }, currentPage: 1, resultCount: 1 } });
  const types = detector.detect(current, previous).map(event => event.type);
  assert.ok(types.includes("RouteChanged"));
  assert.ok(types.includes("SelectionChanged"));
  assert.ok(types.includes("WorkspaceChanged"));
  assert.ok(types.includes("PermissionChanged"));
  assert.ok(types.includes("ContextChanged"));
});

test("provider stores current, previous and session-bounded history without rebuilding unchanged context", () => {
  const provider = new PageContextProvider();
  const events: string[] = [];
  provider.subscribe(event => events.push(event.type));
  const first = provider.update({ route: "/", language: "en" });
  const same = provider.update({ route: "/", language: "en" });
  const next = provider.update({ route: "/about", language: "en" });
  assert.equal(first, same);
  assert.equal(provider.getCurrent(), next);
  assert.equal(provider.getPrevious(), first);
  assert.equal(provider.getHistory().length, 2);
  assert.deepEqual(events.filter(type => type === "ContextLoaded").length, 1);
});

test("Reading Service consumes semantic sections in reading order without raw HTML", () => {
  const snapshot = resolver.resolve({ route: "/help", language: "en", visibleSections: [
    { id: "second", title: "Instructions", content: "Second", readingOrder: 2 },
    { id: "first", title: "Overview", content: "<nav>Ignore</nav> First", readingOrder: 1 },
  ] });
  const reading = new ReadingService().readContext(snapshot);
  assert.equal(reading.blocks[0].text, "Overview");
  assert.equal(reading.blocks.some(block => /Ignore|<nav>/.test(block.text)), false);
});

test("Conversation Engine exposes current, previous and history snapshots without generating AI context", async () => {
  const actor: CurrentUserSession = { role: "admin", name: "Context Test" };
  const engine = new ConversationEngine(new ConversationManager());
  const session = engine.createSession(actor, { pageId: "/admin", pageType: "admin", locale: "en" });
  const initial = engine.readCurrentContext(actor, session.sessionId);
  assert.equal(initial?.pageType, "administration");
  await engine.process(actor, { sessionId: session.sessionId, text: "Help", pageContext: { pageId: "/admin/settings" } });
  assert.equal(engine.readCurrentContext(actor, session.sessionId)?.pageType, "settings");
  assert.equal(engine.readPreviousContext(actor, session.sessionId)?.pageType, "administration");
  assert.equal(engine.readContextHistory(actor, session.sessionId).length, 2);
  const speech = engine.prepareContextSpeech(actor, session.sessionId);
  assert.equal(speech.source.type, "page_reading");
});
