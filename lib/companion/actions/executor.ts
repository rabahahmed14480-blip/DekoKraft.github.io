import type { ActionContext, ActionRequest, ExecutionResult, RegisteredAction } from "./types.ts";

export class ActionExecutor {
  constructor(privateTimeoutMs = 5_000) { this.timeoutMs = privateTimeoutMs; }
  private timeoutMs: number;
  async execute(action: RegisteredAction, request: ActionRequest, context: ActionContext): Promise<ExecutionResult> {
    const started = Date.now(); const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error("ACTION_TIMEOUT")); }, this.timeoutMs); });
      const result = await Promise.race([action.executor(request, context, controller.signal), timeout]);
      return { ...result, requestId: request.requestId, actionId: request.actionId, durationMs: Date.now() - started, completedAt: new Date().toISOString() };
    } catch (error) {
      const timeout = error instanceof Error && error.message === "ACTION_TIMEOUT";
      return { requestId: request.requestId, actionId: request.actionId, status: timeout ? "timeout" : "failure", success: false, message: timeout ? "The action timed out. Please try again." : "The action could not be completed.", durationMs: Date.now() - started, completedAt: new Date().toISOString() };
    } finally { if (timer) clearTimeout(timer); }
  }
}
