import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import type { ActionCategory, ActionParameters } from "../actions/types.ts";
import type { ConversationMemorySnapshot, VisitorIntent } from "../memory/types.ts";
import type { ContextSnapshot, RegisteredPageType } from "../page-context/types.ts";
import type { CompanionContext, CompanionKnowledgeItem } from "../orchestrator/types.ts";
import type { ConversationMessage } from "../types.ts";

export type SkillLifecycleState = "Registered" | "Loaded" | "Ready" | "Executing" | "Completed" | "Failed" | "Disabled";
export type SkillCategory = "greeting" | "product" | "order" | "help" | "fallback" | "conversation" | "design" | "reading" | "shopping" | "search" | "knowledge" | "support" | "marketing";
export type SkillLanguage = "ar" | "en" | "fr" | "de";

export type SkillMetadata = Readonly<{
  identifier: string;
  displayName: string;
  description: string;
  category: SkillCategory;
  supportedIntents: readonly VisitorIntent[];
  supportedPageTypes: readonly RegisteredPageType[] | "*";
  supportedLanguages: readonly SkillLanguage[];
  supportedContexts: readonly RegisteredPageType[] | "*";
  supportedEntities: readonly string[] | "*";
  requiredPermissions: readonly string[];
  priority: number;
  version: string;
}>;

export type SkillActionRecommendation = Readonly<{
  actionId: string;
  category: ActionCategory;
  parameters: ActionParameters;
  reason: string;
  confidence: number;
  requiresConfirmation: boolean;
}>;

export type SkillContext = Readonly<{
  conversation: readonly Readonly<Pick<ConversationMessage, "sender" | "text" | "timestamp" | "messageType">>[];
  companionContext: CompanionContext;
  userIntent: VisitorIntent;
  currentQuestion: string;
  pageContext: ContextSnapshot;
  temporaryMemory: ConversationMemorySnapshot;
  permissions: readonly string[];
  language: "ar" | "en" | "fr" | "de";
  actor: CurrentUserSession;
}>;

export type SkillResult = Readonly<{
  skillId: string;
  summary: string;
  answer: string;
  semanticResponse: string;
  facts: readonly string[];
  recommendations: readonly string[];
  warnings: readonly string[];
  suggestedActions: readonly SkillActionRecommendation[];
  followUpQuestions: readonly string[];
  recommendedActions: readonly SkillActionRecommendation[];
  followUpSuggestions: readonly string[];
  confidence: number;
  usedKnowledge: readonly CompanionKnowledgeItem[];
}>;

export interface CompanionSkill {
  readonly metadata: SkillMetadata;
  canHandle?(context: SkillContext): boolean;
  execute(context: SkillContext): Promise<SkillResult>;
}

export type SkillResolution = Readonly<{
  skill: CompanionSkill;
  score: number;
  matchedIntent: boolean;
  matchedPage: boolean;
  matchedEntity: boolean;
  permitted: boolean;
}>;

export type SkillExecution = Readonly<{
  resolution?: SkillResolution;
  result?: SkillResult;
  state: SkillLifecycleState;
  error?: "SKILL_NOT_FOUND" | "SKILL_PERMISSION_DENIED" | "SKILL_EXECUTION_FAILED";
}>;

export type SkillEventType = "IntentDetected" | "SkillResolved" | "SkillStarted" | "SkillCompleted" | "SkillFailed";
export type SkillEvent = Readonly<{ type: SkillEventType; skillId?: string; intent: VisitorIntent; occurredAt: string; durationMs?: number; status: "success" | "failure" }>;
export type SkillMetric = Readonly<{ skillId: string; executions: number; successes: number; failures: number; successRate: number; failureRate: number; averageResponseTimeMs: number }>;
