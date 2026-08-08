import type { AvatarRenderFrame, MouthCue } from "../avatars/types.ts";
import type { SpeechDocument } from "../speech/types.ts";
import type { ConversationMessage, ConversationSession } from "../types.ts";

export type CompanionOneState = "Idle" | "Listening" | "Thinking" | "Speaking" | "Waiting" | "Error";
export type CompanionOneEventType = "ConversationStarted" | "MessageReceived" | "ThinkingStarted" | "SkillSelected" | "SemanticResponseGenerated" | "SpeechStarted" | "SpeechFinished" | "AvatarReturnedToIdle";
export type CompanionOneEvent = Readonly<{ type: CompanionOneEventType; timestamp: string; sessionId: string; metadata: Readonly<Record<string, string | number | boolean>> }>;
export type IntegrationLog = Readonly<{ timestamp: string; component: string; durationMs: number; status: "success" | "failure"; result: string }>;
export type CompanionOneResult = Readonly<{
  session: ConversationSession;
  companionMessage: ConversationMessage;
  selectedSkill: string;
  semanticResponse: string;
  speech: SpeechDocument;
  mouthCues: readonly MouthCue[];
  idleAvatar: AvatarRenderFrame;
  events: readonly CompanionOneEvent[];
  logs: readonly IntegrationLog[];
  state: CompanionOneState;
}>;
