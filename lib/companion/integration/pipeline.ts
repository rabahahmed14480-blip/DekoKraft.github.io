import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import { ConversationEngine } from "../conversationEngine.ts";
import type { SpeechDocument } from "../speech/types.ts";
import type { ConversationPageContext } from "../types.ts";
import { IntegrationLogger } from "./logger.ts";
import { CompanionOneStateMachine } from "./stateMachine.ts";
import type { CompanionOneEvent, CompanionOneEventType, CompanionOneResult } from "./types.ts";

const phonemesFrom = (speech: SpeechDocument) => {
  let cursor = 0;
  return speech.segments.map(segment => {
    const duration = Math.max(80, segment.estimatedDuration * 1_000);
    const timing = { phoneme: "A", startMs: cursor, endMs: cursor + duration };
    cursor += duration;
    return timing;
  });
};

export class CompanionOnePipeline {
  readonly stateMachine = new CompanionOneStateMachine();
  readonly logger = new IntegrationLogger();
  private events: CompanionOneEvent[] = [];
  private actor?: CurrentUserSession;
  private sessionId?: string;
  private engine: ConversationEngine;

  constructor(engine = new ConversationEngine()) { this.engine = engine; }

  start(actor: CurrentUserSession, page: ConversationPageContext) {
    const session = this.logger.measureSync("ConversationEngine", () => this.engine.createSession(actor, page), result => `session:${result.sessionId}`);
    this.actor = actor; this.sessionId = session.sessionId;
    this.emit("ConversationStarted", {});
    return session;
  }

  async message(text: string): Promise<CompanionOneResult> {
    const { actor, sessionId } = this.requireSession();
    this.stateMachine.transition("Listening");
    this.emit("MessageReceived", { length: text.length });
    this.stateMachine.transition("Thinking");
    this.emit("ThinkingStarted", {});
    try {
      const response = await this.logger.measure("ConversationEngine", () => this.engine.process(actor, { sessionId, text }), result => `message:${result.companionMessage.id}`);
      this.logger.record("EchoBrain", 0, response.reasoning.providerAvailable ? "success" : "failure", response.reasoning.providerId);
      const selectedSkill = response.reasoning.skillExecution.result?.skillId ?? "none";
      this.logger.record("SkillRouter", 0, selectedSkill === "none" ? "failure" : "success", selectedSkill);
      this.emit("SkillSelected", { skill: selectedSkill });
      this.logger.record("CharacterEngine", 0, "success", response.characterResponse.characterId);
      this.emit("SemanticResponseGenerated", { character: response.characterResponse.characterId });
      this.stateMachine.transition("Speaking");
      this.emit("SpeechStarted", {});
      const speech = this.logger.measureSync("SpeechLayer", () => this.engine.prepareSpeech(actor, { sessionId, text: response.companionMessage.text }), result => `segments:${result.segments.length}`);
      const mouthCues = this.logger.measureSync("AvatarLipSync", () => this.engine.synchronizeAvatarSpeech(actor, sessionId, phonemesFrom(speech)), result => `cues:${result.length}`);
      this.emit("SpeechFinished", { segments: speech.segments.length, mouthCues: mouthCues.length });
      this.stateMachine.transition("Waiting");
      const idleAvatar = this.logger.measureSync("AvatarEngine", () => this.engine.renderAvatarState(actor, sessionId, { emotion: "neutral", energy: .2, confidence: response.characterResponse.confidence, interactionType: "idle" }), result => `${result.avatarId}:${result.state}`);
      this.emit("AvatarReturnedToIdle", { avatar: idleAvatar.avatarId });
      this.stateMachine.transition("Idle");
      return { session: response.session, companionMessage: response.companionMessage, selectedSkill, semanticResponse: response.characterResponse.semanticText, speech, mouthCues, idleAvatar, events: this.eventHistory(), logs: this.logger.snapshot(), state: this.stateMachine.state };
    } catch (error) {
      this.stateMachine.transition("Error");
      throw error;
    }
  }

  eventHistory() { return structuredClone(this.events); }
  private emit(type: CompanionOneEventType, metadata: CompanionOneEvent["metadata"]) { const { sessionId } = this.requireSession(); this.events = [...this.events, { type, timestamp: new Date().toISOString(), sessionId, metadata }].slice(-500); }
  private requireSession() { if (!this.actor || !this.sessionId) throw new Error("COMPANION_ONE_NOT_STARTED"); return { actor: this.actor, sessionId: this.sessionId }; }
}
