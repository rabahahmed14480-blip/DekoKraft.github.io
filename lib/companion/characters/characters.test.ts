import assert from "node:assert/strict";
import test from "node:test";
import { ConversationEngine } from "../conversationEngine.ts";
import { ConversationManager } from "../conversationManager.ts";
import { SessionMemoryManager } from "../memory/manager.ts";
import { PageContextResolver } from "../page-context/resolver.ts";
import { CharacterEngine } from "./engine.ts";
import { CompanionCharacterFramework } from "./framework.ts";
import { builtinCharacters } from "./profiles.ts";
import { CharacterRegistry } from "./registry.ts";
import type { CharacterContext, CharacterProfile, SemanticResponse } from "./types.ts";

const page = new PageContextResolver().resolve({
  route: "/info/about",
  pageType: "knowledge_article",
  language: "en",
  permissions: { canShare: true },
  visibleSections: [{ id: "about", title: "About", content: "Verified platform information.", readingOrder: 1 }],
});
const memory = new SessionMemoryManager().start("character-session", page);
const context: CharacterContext = {
  sessionId: "character-session",
  language: "en",
  conversation: [],
  pageContext: page,
  temporaryMemory: memory,
  userPreferences: {},
};
const semantic: SemanticResponse = {
  text: "The platform supports verified designs.",
  facts: ["The platform supports verified designs."],
  confidence: 0.82,
  permissions: ["knowledge.view"],
  actions: [{
    requestId: "action-1",
    actionId: "OpenDocumentation",
    category: "support",
    parameters: {},
    confidence: 0.8,
    requiresConfirmation: false,
    reason: "Open help",
  }],
  followUpSuggestions: ["Read the documentation"],
};
const customProfile = (): CharacterProfile => ({
  ...structuredClone(builtinCharacters[0]),
  metadata: { identifier: "brand.custom", displayName: "Brand Custom", description: "Custom runtime profile", version: "1.0.0", source: "brand" },
});

test("CharacterRegistry supports runtime and future brand character registration", () => {
  const registry = new CharacterRegistry();
  registry.register(customProfile());
  assert.equal(registry.get("brand.custom")?.metadata.source, "brand");
  assert.throws(() => registry.register(customProfile()), /CHARACTER_ALREADY_REGISTERED/);
  assert.equal(registry.unregister("brand.custom"), true);
});

test("initial Professional, Friendly, Designer, Teacher, Minimal and Sales Expert characters exist", () => {
  const framework = new CompanionCharacterFramework();
  assert.deepEqual(framework.registry.list().map(profile => profile.metadata.identifier).sort(), ["designer", "friendly", "minimal", "professional", "sales-expert", "teacher"]);
});

test("character switching stays consistent for the conversation session", () => {
  const framework = new CompanionCharacterFramework();
  framework.switchCharacter("session-a", "friendly");
  framework.switchCharacter("session-b", "minimal");
  assert.equal(framework.current("session-a").profile.metadata.identifier, "friendly");
  assert.equal(framework.current("session-a").profile.metadata.identifier, "friendly");
  assert.equal(framework.current("session-b").profile.metadata.identifier, "minimal");
});

test("characters can be listed, disabled, enabled and switched without deletion", () => {
  const framework = new CompanionCharacterFramework();
  assert.equal(framework.listCharacters().length, 6);
  assert.equal(framework.disable("friendly"), true);
  assert.throws(() => framework.switchCharacter("session-disabled", "friendly"), /CHARACTER_NOT_AVAILABLE/);
  assert.equal(framework.listCharacters().find(item => item.profile.metadata.identifier === "friendly")?.enabled, false);
  assert.equal(framework.enable("friendly"), true);
  assert.equal(framework.switchCharacter("session-enabled", "friendly").profile.metadata.identifier, "friendly");
});

test("tone transformation changes presentation while preserving semantic text and facts", () => {
  const engine = new CharacterEngine();
  const professional = engine.transform(semantic, builtinCharacters.find(profile => profile.metadata.identifier === "professional")!, context);
  const friendly = engine.transform(semantic, builtinCharacters.find(profile => profile.metadata.identifier === "friendly")!, context);
  assert.notEqual(professional.text, friendly.text);
  assert.ok(professional.text.endsWith(semantic.text));
  assert.ok(friendly.text.endsWith(semantic.text));
  assert.equal(professional.semanticText, semantic.text);
  assert.deepEqual(professional.facts, semantic.facts);
});

test("CharacterRenderer exposes presentation bindings without changing semantic content", () => {
  const framework = new CompanionCharacterFramework();
  framework.switchCharacter("render-session", "designer");
  const rendered = framework.transform("render-session", semantic, {
    language: "en",
    conversation: [],
    pageContext: page,
    temporaryMemory: memory,
  });
  assert.match(rendered.text, /design perspective/i);
  assert.equal(rendered.semanticText, semantic.text);
  assert.equal(rendered.voiceBinding.id, "designer-voice");
  assert.equal(rendered.avatarBinding, "companion-designer");
  assert.equal(rendered.emojiPolicy, "minimal");
  assert.deepEqual(rendered.speechPauses, { sentence: .3, paragraph: .5, emphasis: .4 });
});

test("characters cannot change confidence, permissions, actions, or follow-up semantics", () => {
  for (const profile of builtinCharacters) {
    const response = new CharacterEngine().transform(semantic, profile, context);
    assert.equal(response.confidence, semantic.confidence);
    assert.deepEqual(response.permissions, semantic.permissions);
    assert.deepEqual(response.actions, semantic.actions);
    assert.deepEqual(response.followUpSuggestions, semantic.followUpSuggestions);
  }
});

test("Conversation Engine applies the selected character before speech composition", async () => {
  const actor = { role: "admin" as const, name: "Character Test" };
  const engine = new ConversationEngine(new ConversationManager());
  const session = engine.createSession(actor, { pageId: "/info/about", pageType: "public", locale: "en" });
  engine.selectCharacter(actor, session.sessionId, { characterId: "teacher" });
  const result = await engine.process(actor, { sessionId: session.sessionId, text: "Help me." });
  assert.equal(result.characterResponse.characterId, "teacher");
  assert.match(result.companionMessage.text, /work through it/i);
  const speech = engine.prepareSpeech(actor, { sessionId: session.sessionId });
  assert.equal(speech.style, "step-by-step-educational");
  assert.equal(speech.voice.id, "teacher-voice");
  assert.equal(speech.speed, 0.85);
});
