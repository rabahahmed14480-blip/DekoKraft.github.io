import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import type { ActionRequest, ExecutionResult } from "../actions/types.ts";
import type { ConversationPageContext, ConversationSession } from "../types.ts";

export type RuntimeState = "Booting" | "Loading" | "Idle" | "Listening" | "Thinking" | "Planning" | "Executing" | "Speaking" | "Waiting" | "Sleeping" | "Error" | "Shutdown";
export type RuntimeSubsystem = "EchoBrain" | "Skills Framework" | "Character Framework" | "Avatar Framework" | "Speech Layer" | "Action Framework" | "Conversation Engine";
export type RuntimeEvent = Readonly<{ type: "state_changed" | "task_scheduled" | "task_completed" | "task_failed" | "recovered"; state: RuntimeState; occurredAt: string; metadata: Readonly<Record<string, string | number | boolean>> }>;
export type RuntimeSnapshot = Readonly<{ state: RuntimeState; sessionId?: string; subsystems: Readonly<Record<RuntimeSubsystem, "ready" | "unavailable">>; lastError?: string; updatedAt: string }>;
export type RuntimeTask = { id: string; name: string; dueAt: number; priority: number; run(): Promise<void> };
export type PerformanceMetric = Readonly<{ operation: string; durationMs: number; success: boolean; recordedAt: string }>;
export type RuntimeConversationEngine = {
  createSession(actor: CurrentUserSession, page: ConversationPageContext): ConversationSession;
  process(actor: CurrentUserSession, input: { sessionId: string; text: string }): Promise<unknown>;
  executeAction(actor: CurrentUserSession, sessionId: string, request: ActionRequest, confirmed?: boolean): Promise<ExecutionResult>;
  prepareSpeech(actor: CurrentUserSession, input: { sessionId: string; text?: string }): unknown;
  endSession(actor: CurrentUserSession, sessionId: string): void;
};

