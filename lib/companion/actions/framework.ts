import { builtinActions } from "./builtins.ts";
import { ActionDispatcher } from "./dispatcher.ts";
import { ActionExecutor } from "./executor.ts";
import { ExecutionHistory } from "./history.ts";
import { ActionPlanner } from "./planner.ts";
import { PermissionValidator } from "./permissionValidator.ts";
import { ActionRegistry } from "./registry.ts";
import { ActionValidator } from "./validator.ts";
import type { ActionContext, ActionRequest, RegisteredAction } from "./types.ts";

export class CompanionActionFramework {
  readonly registry: ActionRegistry; readonly planner: ActionPlanner; readonly dispatcher: ActionDispatcher;
  constructor(input: { actions?: RegisteredAction[]; timeoutMs?: number } = {}) {
    this.registry = new ActionRegistry(); for (const action of input.actions ?? builtinActions) this.registry.register(action);
    this.planner = new ActionPlanner(); this.dispatcher = new ActionDispatcher(this.registry, new ActionValidator(), new PermissionValidator(), new ActionExecutor(input.timeoutMs), new ExecutionHistory());
  }
  execute(request: ActionRequest, context: ActionContext) { return this.dispatcher.dispatch(request, context); }
  history(sessionId: string) { return this.dispatcher.historyFor(sessionId); }
  clearSession(sessionId: string) { this.dispatcher.clearHistory(sessionId); }
}
