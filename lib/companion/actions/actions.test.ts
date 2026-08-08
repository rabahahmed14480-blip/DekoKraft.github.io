import assert from "node:assert/strict";
import test from "node:test";
import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import { ConversationEngine } from "../conversationEngine.ts";
import { SessionMemoryManager } from "../memory/manager.ts";
import { PageContextResolver } from "../page-context/resolver.ts";
import { ConversationManager } from "../conversationManager.ts";
import { CompanionActionFramework } from "./framework.ts";
import { ActionPlanner } from "./planner.ts";
import { ActionRegistry } from "./registry.ts";
import type { ActionContext, ActionRequest, RegisteredAction } from "./types.ts";

const actor: CurrentUserSession = { role: "admin", name: "Action Test" };
const contextResolver = new PageContextResolver();
const page = contextResolver.resolve({ route: "/admin/settings", pageType: "settings", language: "en", permissions: { canEdit: true } });
const memoryManager = new SessionMemoryManager();
const memory = memoryManager.start("action-session", page);
const context = (permissions: string[] = [], confirmed = false): ActionContext => ({ sessionId: "action-session", actor, page, memory, permissions, confirmed });
const request = (overrides: Partial<ActionRequest> = {}): ActionRequest => ({ requestId: "request-1", actionId: "OpenPage", category: "navigation", parameters: { target: "/home" }, confidence: .9, requiresConfirmation: false, reason: "Open home", ...overrides });

test("ActionRegistry registers actions and rejects duplicate identifiers", () => {
  const registry = new ActionRegistry();
  const action: RegisteredAction = { identifier: "ThirdPartyAction", category: "system", requiredPermissions: [], supportedPageTypes: "*", confirmationPolicy: "never", validateParameters: () => true, executor: async () => ({ status: "success", success: true, message: "Done" }) };
  registry.register(action);
  assert.equal(registry.get("ThirdPartyAction"), action);
  assert.throws(() => registry.register(action), /ACTION_ALREADY_REGISTERED/);
});

test("ActionPlanner converts EchoBrain structured requests without executing them", () => {
  const planned = new ActionPlanner().plan([{ id: "open", type: "open_settings", label: "Open settings", target: "/admin/settings", requiresConfirmation: false }]);
  assert.equal(planned[0].actionId, "OpenSettings");
  assert.equal(planned[0].category, "settings");
  assert.equal(planned[0].parameters.target, "/admin/settings");
});

test("framework validates and executes navigation through a structured result", async () => {
  const framework = new CompanionActionFramework();
  const result = await framework.execute(request(), context());
  assert.equal(result.status, "success");
  assert.equal(result.output?.directive, "navigate");
  assert.equal(result.output?.href, "/home");
});

test("permission and page validators deny unavailable actions", async () => {
  const protectedAction: RegisteredAction = { identifier: "Protected", category: "design", requiredPermissions: ["design.edit"], supportedPageTypes: ["design_workspace"], confirmationPolicy: "never", validateParameters: () => true, executor: async () => ({ status: "success", success: true, message: "Done" }) };
  const framework = new CompanionActionFramework({ actions: [protectedAction] });
  const denied = await framework.execute(request({ actionId: "Protected", category: "design", parameters: {} }), context());
  assert.equal(denied.status, "not_available");
  const designPage = contextResolver.resolve({ route: "/studio", pageType: "design_workspace", language: "en" });
  const designMemory = new SessionMemoryManager().start("design", designPage);
  const permissionDenied = await framework.execute(request({ actionId: "Protected", category: "design", parameters: {} }), { ...context(), sessionId: "design", page: designPage, memory: designMemory });
  assert.equal(permissionDenied.status, "permission_denied");
});

test("confirmation flow prevents destructive execution until explicitly confirmed", async () => {
  let executions = 0;
  const destructive: RegisteredAction = { identifier: "ArchiveDesign", category: "design", requiredPermissions: ["design.archive"], supportedPageTypes: "*", confirmationPolicy: "always", validateParameters: () => true, executor: async () => { executions += 1; return { status: "success", success: true, message: "Archived" }; } };
  const framework = new CompanionActionFramework({ actions: [destructive] });
  const pending = await framework.execute(request({ actionId: "ArchiveDesign", category: "design", parameters: {}, requiresConfirmation: true }), context(["design.archive"]));
  assert.equal(pending.status, "confirmation_required");
  assert.equal(executions, 0);
  const completed = await framework.execute(request({ actionId: "ArchiveDesign", category: "design", parameters: {}, requiresConfirmation: true }), context(["design.archive"], true));
  assert.equal(completed.status, "success");
  assert.equal(executions, 1);
});

test("unsafe parameters, hidden routes and unknown actions fail without internal exceptions", async () => {
  const framework = new CompanionActionFramework();
  const unsafe = await framework.execute(request({ parameters: { target: "javascript:alert(1)" } }), context());
  const hidden = await framework.execute(request({ parameters: { target: "/internal/secrets" } }), context());
  const unknown = await framework.execute(request({ actionId: "HiddenAction" }), context());
  assert.equal(unsafe.status, "validation_failed");
  assert.equal(hidden.status, "validation_failed");
  assert.equal(unknown.status, "validation_failed");
  assert.equal(JSON.stringify([unsafe, hidden, unknown]).includes("stack"), false);
});

test("reading, workspace and shopping actions enforce page availability", async () => {
  const framework = new CompanionActionFramework();
  assert.equal((await framework.execute(request({ actionId: "StartReading", category: "reading", parameters: {} }), context())).status, "success");
  assert.equal((await framework.execute(request({ actionId: "SwitchTool", category: "workspace", parameters: {} }), context())).status, "not_available");
  assert.equal((await framework.execute(request({ actionId: "OpenCheckout", category: "shopping", parameters: {} }), context())).status, "not_available");
});

test("executor returns friendly failure and timeout results", async () => {
  const failure: RegisteredAction = { identifier: "Failure", category: "system", requiredPermissions: [], supportedPageTypes: "*", confirmationPolicy: "never", validateParameters: () => true, executor: async () => { throw new Error("private stack details"); } };
  const slow: RegisteredAction = { ...failure, identifier: "Slow", executor: async () => new Promise(resolve => setTimeout(() => resolve({ status: "success", success: true, message: "Late" }), 50)) };
  const framework = new CompanionActionFramework({ actions: [failure, slow], timeoutMs: 5 });
  const failed = await framework.execute(request({ actionId: "Failure", category: "system", parameters: {} }), context());
  const timedOut = await framework.execute(request({ actionId: "Slow", category: "system", parameters: {} }), context());
  assert.equal(failed.status, "failure");
  assert.equal(failed.message.includes("private"), false);
  assert.equal(timedOut.status, "timeout");
});

test("history and events stay lightweight and exclude parameters", async () => {
  const framework = new CompanionActionFramework();
  const events: string[] = [];
  framework.dispatcher.subscribe(event => events.push(event.type));
  await framework.execute(request({ parameters: { target: "/home", token: "must-not-store" } }), context());
  await framework.execute(request(), context());
  const history = framework.history("action-session");
  assert.equal(history.length, 2);
  assert.equal(JSON.stringify(history).includes("must-not-store"), false);
  assert.ok(events.includes("ActionRequested"));
  assert.ok(events.includes("ActionCompleted"));
});

test("Conversation Engine plans deterministic commands and executes only through CAF", async () => {
  const engine = new ConversationEngine(new ConversationManager());
  const session = engine.createSession(actor, { pageId: "/admin", pageType: "admin", locale: "en" });
  const response = await engine.process(actor, { sessionId: session.sessionId, text: "Open settings" });
  assert.equal(response.plannedActions[0].actionId, "OpenSettings");
  const result = await engine.executeAction(actor, session.sessionId, response.plannedActions[0], false);
  assert.equal(result.status, "success");
  assert.equal(result.output?.href, "/admin/settings");
  assert.equal(engine.readActionHistory(actor, session.sessionId).length, 1);
});

test("bounded framework remains fast under repeated dispatch", async () => {
  const framework = new CompanionActionFramework();
  const started = performance.now();
  for (let index = 0; index < 250; index += 1) await framework.execute(request({ requestId: `request-${index}` }), context());
  assert.ok(performance.now() - started < 1200);
  assert.equal(framework.history("action-session").length, 100);
});
