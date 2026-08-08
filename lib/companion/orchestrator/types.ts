import type { ConversationMemorySnapshot, ResolvedReference, VisitorIntent } from "../memory/types.ts";
import type { ContextSnapshot } from "../page-context/types.ts";
import type { ConversationMessage, ConversationSession } from "../types.ts";

export type CompanionCharacter = { id: string; tone: "professional" | "friendly" | "calm"; style: string; speechStyle: string; greetingStyle: string };
export type CompanionKnowledgeItem = { id: string; domain: string; kind: string; title: string; summary: string; confidence: string; sourceIds: string[] };
export type ConversationContextEvent = Readonly<{ type: "ContextBuilt"; sessionId: string; occurredAt: string }>;
export type CompanionContext = Readonly<{
  contextVersion: 1; conversation: readonly Readonly<Pick<ConversationMessage, "sender" | "text" | "timestamp" | "messageType">>[];
  page: ContextSnapshot; memory: ConversationMemorySnapshot; conversationState: ConversationSession["state"];
  userContext: Readonly<{ role: "admin" | "participant"; participantId?: string; name?: string; storeName?: string; email?: string }>;
  selectedCompanion: CompanionCharacter;
  visitorIntent: VisitorIntent; knowledge: CompanionKnowledgeItem[]; character: CompanionCharacter;
  language: ConversationSession["locale"]; direction: "rtl" | "ltr"; workspace: ContextSnapshot["workspace"];
  readingState?: { active: boolean; section?: string; progress?: number }; permissions: string[];
  resolvedReferences: ResolvedReference[]; builtAt: string;
}>;
export type ConversationContext = CompanionContext;
export type ReasoningAction = {
  id: string; type: "read_page" | "open_product" | "start_comparison" | "navigate" | "open_settings" | "recommend_service";
  label: string; target?: string; serviceId?: string; requiredPermission?: string; requiresConfirmation: boolean;
};
export type ReasoningResponseType = "explanation" | "recommendation" | "comparison" | "clarification" | "question" | "reading" | "summary" | "action_suggestion" | "navigation_suggestion";
export type ReasoningRequest = Readonly<{ requestId: string; conversation: readonly Readonly<Pick<ConversationMessage, "sender" | "text" | "timestamp" | "messageType">>[]; companionContext: CompanionContext; currentQuestion: string }>;
export type ReasoningResponse = { text: string; type: ReasoningResponseType; confidence: number; missingContext: string[]; knowledgeSources: string[]; suggestedFollowUp: string[]; actions: ReasoningAction[] };
export type ReasoningOutcome = {
  request: ReasoningRequest;
  response: ReasoningResponse;
  providerId: string;
  providerAvailable: boolean;
  knowledgeAvailable: boolean;
  skillExecution: import("../skills/types.ts").SkillExecution;
};
export interface EchoBrainReasoningProvider { readonly id: string; readonly available: boolean; reason(request: ReasoningRequest): Promise<ReasoningResponse>; }
export type OrchestratorInput = { actor: import("../../auth/sessionTypes.ts").CurrentUserSession; page: ContextSnapshot; memory: ConversationMemorySnapshot; session: ConversationSession; currentQuestion: string; resolvedReferences: ResolvedReference[]; permissions: string[]; knowledgeScope: import("../../knowledge/types.ts").KnowledgeScope; character?: CompanionCharacter };
