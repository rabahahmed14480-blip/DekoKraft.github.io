import assert from "node:assert/strict";
import test from "node:test";
import { ConversationEngine } from "../conversationEngine.ts";
import { ConversationManager } from "../conversationManager.ts";
import { CompanionOnePipeline } from "./pipeline.ts";

test('Companion One completes the "Hello" pipeline through every existing framework', async () => {
  const actor = { role: "admin" as const, name: "Companion One Test" };
  const pipeline = new CompanionOnePipeline(new ConversationEngine(new ConversationManager()));
  pipeline.start(actor, { pageId: "/welcome", pageType: "public", locale: "en" });
  const result = await pipeline.message("Hello");

  assert.equal(result.selectedSkill, "greeting");
  assert.equal(result.semanticResponse, "Hello! How can I help?");
  assert.match(result.companionMessage.text, /Certainly[\s\S]*Hello! How can I help/);
  assert.ok(result.speech.segments.length > 0);
  assert.ok(result.mouthCues.length > 0);
  assert.equal(result.idleAvatar.state, "Idle");
  assert.equal(result.state, "Idle");

  assert.deepEqual(result.events.map(event => event.type), [
    "ConversationStarted",
    "MessageReceived",
    "ThinkingStarted",
    "SkillSelected",
    "SemanticResponseGenerated",
    "SpeechStarted",
    "SpeechFinished",
    "AvatarReturnedToIdle",
  ]);

  for (const component of ["ConversationEngine", "EchoBrain", "SkillRouter", "CharacterEngine", "SpeechLayer", "AvatarLipSync", "AvatarEngine"]) {
    const entries = result.logs.filter(entry => entry.component === component);
    assert.ok(entries.length > 0, `${component} must be logged`);
    for (const entry of entries) {
      assert.ok(entry.timestamp);
      assert.ok(entry.durationMs >= 0);
      assert.ok(entry.status === "success" || entry.status === "failure");
      assert.ok(entry.result.length > 0);
    }
  }
});

test("integration state moves to Error when a pipeline message is invalid", async () => {
  const actor = { role: "admin" as const, name: "Companion One Error Test" };
  const pipeline = new CompanionOnePipeline(new ConversationEngine(new ConversationManager()));
  pipeline.start(actor, { pageId: "/welcome", pageType: "public", locale: "en" });
  await assert.rejects(() => pipeline.message("   "), /CONVERSATION_TEXT_REQUIRED/);
  assert.equal(pipeline.stateMachine.state, "Error");
  assert.equal(pipeline.logger.snapshot().at(-1)?.status, "failure");
});

