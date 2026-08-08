import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { ConversationEngine } from "../conversationEngine.ts";
import { ConversationManager } from "../conversationManager.ts";
import { LipSyncEngine } from "./behaviorEngines.ts";
import { AvatarEngine } from "./engine.ts";
import { CompanionAvatarFramework } from "./framework.ts";
import { builtinAvatars } from "./profiles.ts";
import { AvatarRegistry } from "./registry.ts";

test("AvatarRegistry registers, loads, unloads, lists and previews avatars", () => {
  const registry = new AvatarRegistry();
  registry.register(builtinAvatars[0]);
  assert.equal(registry.list().length, 1);
  assert.equal(registry.preview("companion-professional").loaded, false);
  registry.load("companion-professional");
  assert.equal(registry.preview("companion-professional").loaded, true);
  assert.equal(registry.unload("companion-professional"), true);
  assert.throws(() => registry.register(builtinAvatars[0]), /AVATAR_ALREADY_REGISTERED/);
});

test("CompanionAvatarFramework switches avatars independently per session", () => {
  const framework = new CompanionAvatarFramework();
  framework.switchAvatar("avatar-a", "companion-friendly");
  framework.switchAvatar("avatar-b", "companion-designer");
  assert.equal(framework.current("avatar-a").identifier, "companion-friendly");
  assert.equal(framework.current("avatar-b").identifier, "companion-designer");
  assert.equal(framework.list().length, 6);
});

test("AvatarEngine renders expressions, gestures, eye contact and posture from visual signals only", () => {
  const frame = new AvatarEngine().render(builtinAvatars[1], { emotion: "happy", energy: .85, confidence: .9, interactionType: "speaking" });
  assert.equal(frame.state, "Speaking");
  assert.equal(frame.expression.id, "happy");
  assert.equal(frame.expression.mouth, "smile");
  assert.equal(frame.gesture.id, "welcome");
  assert.equal(frame.eyeContact.target, "user");
  assert.equal(frame.pose.id, "speaking");
});

test("warning and celebration signals select supported gestures without actions or knowledge", () => {
  const engine = new AvatarEngine();
  const warning = engine.render(builtinAvatars[0], { emotion: "warning", energy: .7, confidence: .95, interactionType: "notification" });
  const celebration = engine.render(builtinAvatars[0], { emotion: "celebrating", energy: 1, confidence: 1, interactionType: "notification" });
  assert.equal(warning.gesture.id, "caution");
  assert.equal(celebration.gesture.id, "celebrate");
  assert.equal("actions" in warning, false);
  assert.equal("knowledge" in warning, false);
});

test("LipSyncEngine converts valid phoneme timing into mouth animation cues only", () => {
  const cues = new LipSyncEngine().synchronize([
    { phoneme: "M", startMs: 0, endMs: 80 },
    { phoneme: "A", startMs: 80, endMs: 180 },
    { phoneme: "invalid!", startMs: 180, endMs: 220 },
  ]);
  assert.deepEqual(cues.map(cue => cue.shape), ["closed", "open-wide"]);
  assert.deepEqual(cues.map(cue => [cue.startMs, cue.endMs]), [[0, 80], [80, 180]]);
});

test("IdleBehaviorEngine produces bounded blinking, breathing, eye, head and natural motion", () => {
  const framework = new CompanionAvatarFramework();
  framework.switchAvatar("idle-session", "companion-minimal");
  const frame = framework.render("idle-session", { emotion: "neutral", energy: .2, confidence: .7, interactionType: "idle" }, 6_050);
  assert.equal(frame.state, "Idle");
  assert.equal(frame.idleBehavior?.blink, true);
  assert.ok((frame.idleBehavior?.breathing ?? -1) >= 0);
  assert.ok(Math.abs(frame.idleBehavior?.eyeMovement ?? 2) <= .25);
  assert.ok(Math.abs(frame.idleBehavior?.headMovement ?? 2) <= .12);
});

test("Character selection binds the matching avatar without exposing character internals", async () => {
  const actor = { role: "admin" as const, name: "Avatar Test" };
  const engine = new ConversationEngine(new ConversationManager());
  const session = engine.createSession(actor, { pageId: "/info/about", pageType: "public", locale: "en" });
  engine.selectCharacter(actor, session.sessionId, { characterId: "designer" });
  const response = await engine.process(actor, { sessionId: session.sessionId, text: "Help me." });
  assert.equal(response.characterResponse.avatarBinding, "companion-designer");
  assert.equal(response.avatarFrame.avatarId, "companion-designer");
  assert.equal(response.avatarFrame.expression.id, "surprised");
});

test("avatar rendering remains bounded under repeated frame generation", () => {
  const engine = new AvatarEngine();
  const started = performance.now();
  for (let index = 0; index < 10_000; index += 1) engine.render(builtinAvatars[0], { emotion: "neutral", energy: .5, confidence: .9, interactionType: index % 2 ? "speaking" : "idle" }, index * 16);
  assert.ok(performance.now() - started < 1_500);
});

