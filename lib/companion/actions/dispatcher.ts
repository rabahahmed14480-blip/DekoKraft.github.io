import { ActionExecutor } from "./executor.ts";
import { ExecutionHistory } from "./history.ts";
import { PermissionValidator } from "./permissionValidator.ts";
import { ActionRegistry } from "./registry.ts";
import { ActionValidator } from "./validator.ts";
import type { ActionContext, ActionEvent, ActionRequest, ExecutionResult } from "./types.ts";

export class ActionDispatcher {
  private listeners = new Set<(event: ActionEvent) => void>();
  constructor(privateRegistry: ActionRegistry, privateValidator = new ActionValidator(), privatePermissions = new PermissionValidator(), privateExecutor = new ActionExecutor(), privateHistory = new ExecutionHistory()) { this.registry = privateRegistry; this.validator = privateValidator; this.permissions = privatePermissions; this.executor = privateExecutor; this.history = privateHistory; }
  private registry: ActionRegistry; private validator: ActionValidator; private permissions: PermissionValidator; private executor: ActionExecutor; private history: ExecutionHistory;
  async dispatch(request: ActionRequest, context: ActionContext): Promise<ExecutionResult> {
    this.emit("ActionRequested", request, context);
    const action = this.registry.get(request.actionId); const validation = this.validator.validate(request, action);
    if (!validation.valid) return this.finish(context.sessionId, request, { status: "validation_failed", success: false, message: validation.message }, "ActionFailed");
    this.emit("ActionValidated", request, context);
    const permission = this.permissions.validate(action!, context);
    if (!permission.allowed) return this.finish(context.sessionId, request, { status: permission.status, success: false, message: permission.message }, permission.status === "permission_denied" ? "PermissionDenied" : "ActionFailed");
    const confirmation = action!.confirmationPolicy === "always" || (action!.confirmationPolicy === "requested" && request.requiresConfirmation);
    if (confirmation && !context.confirmed) return this.finish(context.sessionId, request, { status: "confirmation_required", success: false, message: "Please confirm this action.", requiresConfirmation: true }, "ActionCancelled");
    this.emit("ActionStarted", request, context);
    const result = await this.executor.execute(action!, request, context); this.history.add(context.sessionId, result);
    this.emit(result.success ? "ActionCompleted" : "ActionFailed", request, context, result.status);
    return result;
  }
  historyFor(sessionId: string) { return this.history.get(sessionId); }
  clearHistory(sessionId: string) { this.history.clear(sessionId); }
  subscribe(listener: (event: ActionEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private finish(sessionId: string, request: ActionRequest, input: Pick<ExecutionResult, "status" | "success" | "message" | "requiresConfirmation">, event: ActionEvent["type"]) { const result: ExecutionResult = { ...input, requestId: request.requestId, actionId: request.actionId, durationMs: 0, completedAt: new Date().toISOString() }; this.history.add(sessionId, result); this.emit(event, request, { sessionId } as ActionContext, result.status); return result; }
  private emit(type: ActionEvent["type"], request: ActionRequest, context: Pick<ActionContext, "sessionId">, status?: ExecutionResult["status"]) { const event: ActionEvent = { type, sessionId: context.sessionId, requestId: request.requestId, actionId: request.actionId, occurredAt: new Date().toISOString(), status }; for (const listener of this.listeners) listener(event); }
}
