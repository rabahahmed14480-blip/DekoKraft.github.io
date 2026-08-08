import assert from "node:assert/strict";
import test from "node:test";
import { CompanionActionFramework } from "../actions/framework.ts";
import { SessionMemoryManager } from "../memory/manager.ts";
import { PageContextResolver } from "../page-context/resolver.ts";
import type { CompanionContext } from "../orchestrator/types.ts";
import { CompanionSkillsFramework } from "./framework.ts";
import { SkillRegistry } from "./registry.ts";
import { SkillRouter } from "./router.ts";
import type { CompanionSkill, SkillContext } from "./types.ts";

const page = new PageContextResolver().resolve({
  route: "/gift/example",
  pageType: "product",
  language: "en",
  entity: { id: "example", type: "product", displayName: "Example", visibility: "public" },
  permissions: { canPurchase: true },
  visibleSections: [{ id: "details", title: "Details", content: "Verified product details", readingOrder: 1 }],
});
const memory = new SessionMemoryManager().start("skills-session", page);
const companionContext: CompanionContext = Object.freeze({
  contextVersion: 1,
  conversation: [],
  page,
  memory,
  conversationState: "active",
  userContext: Object.freeze({ role: "admin", name: "Skill Test" }),
  visitorIntent: "learn",
  knowledge: [{ id: "k1", domain: "product", kind: "verified", title: "Product", summary: "Verified product knowledge.", confidence: "verified", sourceIds: ["source-1"] }],
  character: Object.freeze({ id: "default", tone: "friendly", style: "clear", speechStyle: "natural", greetingStyle: "warm" }),
  selectedCompanion: Object.freeze({ id: "default", tone: "friendly", style: "clear", speechStyle: "natural", greetingStyle: "warm" }),
  language: "en",
  direction: "ltr",
  workspace: page.workspace,
  permissions: [],
  resolvedReferences: [],
  builtAt: new Date().toISOString(),
});
const context = (overrides: Partial<SkillContext> = {}): SkillContext => ({
  conversation: [],
  companionContext,
  userIntent: "learn",
  currentQuestion: "Tell me about this product",
  pageContext: page,
  temporaryMemory: memory,
  permissions: [],
  language: "en",
  actor: { role: "admin", name: "Skill Test" },
  ...overrides,
});

const externalSkill = (input: { id: string; priority?: number; permission?: string; fail?: boolean }): CompanionSkill => ({
  metadata: {
    identifier: input.id,
    displayName: input.id,
    description: "External test skill",
    category: "knowledge",
    supportedIntents: ["learn"],
    supportedPageTypes: "*",
    supportedLanguages: ["ar", "en", "fr", "de"],
    supportedContexts: "*",
    supportedEntities: "*",
    requiredPermissions: input.permission ? [input.permission] : [],
    priority: input.priority ?? 1,
    version: "1.0.0",
  },
  async execute(skillContext) {
    if (input.fail) throw new Error("private implementation failure");
    return {
      skillId: input.id,
      summary: "Structured summary",
      answer: "Structured answer",
      semanticResponse: "Structured answer",
      facts: ["Structured fact"],
      recommendations: [],
      warnings: [],
      suggestedActions: [],
      followUpQuestions: [],
      recommendedActions: [],
      followUpSuggestions: [],
      confidence: 1,
      usedKnowledge: skillContext.companionContext.knowledge,
    };
  },
});

test("SkillRegistry registers, replaces through unregister, and tracks lifecycle", () => {
  const registry = new SkillRegistry();
  registry.register(externalSkill({ id: "external.one" }));
  assert.equal(registry.get("external.one")?.metadata.displayName, "external.one");
  assert.equal(registry.lifecycle.get("external.one"), "Ready");
  assert.throws(() => registry.register(externalSkill({ id: "external.one" })), /SKILL_ALREADY_REGISTERED/);
  assert.equal(registry.unregister("external.one"), true);
  registry.register(externalSkill({ id: "external.one", priority: 20 }));
  assert.equal(registry.get("external.one")?.metadata.priority, 20);
});

test("SkillRouter resolves by intent, page, entity and highest priority", () => {
  const registry = new SkillRegistry();
  registry.register(externalSkill({ id: "priority.low", priority: 10 }));
  registry.register(externalSkill({ id: "priority.high", priority: 99 }));
  const resolution = new SkillRouter(registry).resolveSkill(context());
  assert.equal(resolution?.skill.metadata.identifier, "priority.high");
  assert.equal(resolution?.matchedIntent, true);
  assert.equal(resolution?.matchedPage, true);
});

test("initial domain and generic integration skills exist", () => {
  const framework = new CompanionSkillsFramework();
  assert.deepEqual(framework.registry.list().map(skill => skill.metadata.identifier).sort(), ["conversation", "design", "fallback", "greeting", "help", "knowledge", "marketing", "order", "product", "reading", "search", "shopping", "support"]);
});

test("built-in skill executes with structured knowledge-backed result", async () => {
  const execution = await new CompanionSkillsFramework().execute(context());
  assert.equal(execution.state, "Completed");
  assert.equal(execution.result?.skillId, "product");
  assert.equal(execution.result?.usedKnowledge[0].id, "k1");
  assert.match(execution.result?.answer ?? "", /Verified product knowledge/);
});

test("skill recommendations integrate with CAF and never execute directly", async () => {
  const skills = new CompanionSkillsFramework();
  const actions = new CompanionActionFramework();
  const execution = await skills.execute(context());
  const requests = skills.toActionRequests(execution, actions);
  assert.equal(requests[0].actionId, "OpenProduct");
  const result = await actions.execute(requests[0], {
    sessionId: "skills-session",
    actor: context().actor,
    page,
    memory,
    permissions: [],
    confirmed: false,
  });
  assert.equal(result.status, "success");
  assert.equal(result.success, true);
});

test("permissions are enforced during resolution", async () => {
  const registry = new SkillRegistry();
  registry.register(externalSkill({ id: "secured.skill", permission: "knowledge.private" }));
  const denied = await new SkillRouter(registry).execute(context());
  assert.equal(denied.error, "SKILL_PERMISSION_DENIED");
  const allowed = await new SkillRouter(registry).execute(context({ permissions: ["knowledge.private"] }));
  assert.equal(allowed.state, "Completed");
});

test("disabled and failed skills are safely isolated", async () => {
  const registry = new SkillRegistry();
  registry.register(externalSkill({ id: "failing.skill", fail: true }));
  const router = new SkillRouter(registry);
  const failed = await router.execute(context());
  assert.equal(failed.error, "SKILL_EXECUTION_FAILED");
  assert.equal(registry.lifecycle.get("failing.skill"), "Failed");
  registry.enable("failing.skill");
  registry.disable("failing.skill");
  const disabled = await router.execute(context());
  assert.equal(disabled.error, "SKILL_NOT_FOUND");
});

test("failed skill execution emits events, records metrics, and automatically invokes FallbackSkill", async () => {
  const framework = new CompanionSkillsFramework({ skills: [externalSkill({ id: "broken.skill", priority: 5_000, fail: true }), frameworkFallback()] });
  const execution = await framework.execute(context());
  assert.equal(execution.result?.skillId, "fallback");
  assert.deepEqual(framework.router.eventHistory().map(event => event.type), ["IntentDetected", "SkillResolved", "SkillStarted", "SkillFailed", "SkillResolved", "SkillStarted", "SkillCompleted"]);
  const brokenMetric = framework.router.metrics().find(metric => metric.skillId === "broken.skill");
  assert.equal(brokenMetric?.executions, 1);
  assert.equal(brokenMetric?.failureRate, 1);
  assert.ok((brokenMetric?.averageResponseTimeMs ?? -1) >= 0);
});

function frameworkFallback(): CompanionSkill {
  return {
    metadata: { identifier: "fallback", displayName: "Fallback", description: "Safe fallback", category: "fallback", supportedIntents: ["learn"], supportedPageTypes: "*", supportedLanguages: ["en"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 1, version: "1.0.0" },
    canHandle: () => true,
    async execute() {
      return { skillId: "fallback", summary: "fallback", answer: "Please clarify.", semanticResponse: "Please clarify.", facts: [], recommendations: [], warnings: [], suggestedActions: [], followUpQuestions: ["Could you clarify?"], recommendedActions: [], followUpSuggestions: ["Could you clarify?"], confidence: .5, usedKnowledge: [] };
    },
  };
}
