import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import type { ConversationMemorySnapshot } from "../memory/types.ts";
import type { ContextSnapshot, RegisteredPageType } from "../page-context/types.ts";

export type ActionCategory = "navigation" | "reading" | "workspace" | "design" | "shopping" | "search" | "settings" | "knowledge" | "support" | "media" | "system";
export type ActionParameters = Record<string, string | number | boolean | null | string[]>;
export type ActionRequest = {
  requestId: string; actionId: string; category: ActionCategory; parameters: ActionParameters;
  confidence: number; requiresConfirmation: boolean; reason: string;
};
export type ExecutionStatus = "success" | "failure" | "cancelled" | "permission_denied" | "not_available" | "validation_failed" | "timeout" | "confirmation_required";
export type ExecutionResult = {
  requestId: string; actionId: string; status: ExecutionStatus; success: boolean; message: string;
  output?: Record<string, string | number | boolean | null>; requiresConfirmation?: boolean; durationMs: number; completedAt: string;
};
export type ActionContext = {
  sessionId: string; actor: CurrentUserSession; page: ContextSnapshot; memory: ConversationMemorySnapshot;
  permissions: string[]; confirmed: boolean;
};
export type ActionExecutorFunction = (request: ActionRequest, context: ActionContext, signal: AbortSignal) => Promise<Omit<ExecutionResult, "requestId" | "actionId" | "durationMs" | "completedAt">>;
export type RegisteredAction = {
  identifier: string; category: ActionCategory; requiredPermissions: string[]; supportedPageTypes: RegisteredPageType[] | "*";
  confirmationPolicy: "never" | "requested" | "always"; validateParameters(parameters: ActionParameters): boolean;
  executor: ActionExecutorFunction;
};
export type ActionEventType = "ActionRequested" | "ActionValidated" | "ActionStarted" | "ActionCompleted" | "ActionFailed" | "ActionCancelled" | "PermissionDenied";
export type ActionEvent = { type: ActionEventType; sessionId: string; requestId: string; actionId: string; occurredAt: string; status?: ExecutionStatus };
export type ExecutionHistoryEntry = { actionId: string; time: string; status: ExecutionStatus; durationMs: number };
