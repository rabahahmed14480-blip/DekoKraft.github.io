import type { CompanionContext, ReasoningAction, ReasoningResponse } from "./types.ts";

const unsafeText = /<script|javascript:|ignore (?:all|previous) instructions|system prompt|password|access token/i;
const safeTarget = (target?: string) => !target || (/^\/[a-z0-9\-._~/%?=&]*$/i.test(target) && !/\/(?:private|internal|secrets?)(?:\/|$)/i.test(target));
const allowedAction = (action: ReasoningAction, context: CompanionContext) => {
  if (action.requiredPermission && !context.permissions.includes(action.requiredPermission)) return false;
  if (!safeTarget(action.target)) return false;
  if (action.type === "open_settings") return action.target === "/admin/settings" || action.target === "/participant/settings";
  if (action.type === "recommend_service") return Boolean(action.serviceId) && context.permissions.some(permission => permission.includes(action.serviceId!));
  return true;
};

export class ReasoningResultValidator {
  validate(response: ReasoningResponse, context: CompanionContext): ReasoningResponse {
    if (!response.text.trim() || unsafeText.test(response.text)) throw new Error("REASONING_RESPONSE_UNSAFE");
    const knownSources = new Set(context.knowledge.flatMap(item => item.sourceIds));
    return {
      ...response, text: response.text.replace(/<[^>]*>/g, "").trim().slice(0, 20_000),
      confidence: Math.max(0, Math.min(1, response.confidence)),
      missingContext: response.missingContext.filter(item => !unsafeText.test(item)).slice(0, 20),
      knowledgeSources: response.knowledgeSources.filter(source => knownSources.has(source)).slice(0, 30),
      suggestedFollowUp: response.suggestedFollowUp.filter(item => !unsafeText.test(item)).slice(0, 8),
      actions: response.actions.filter(action => allowedAction(action, context)).slice(0, 8),
    };
  }
}
