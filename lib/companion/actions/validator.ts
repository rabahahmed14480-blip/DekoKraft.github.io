import type { ActionRequest, RegisteredAction } from "./types.ts";

const unsafeKey = /secret|token|password|cookie|credential|private|internal/i;
const unsafeValue = /javascript:|<script|(?:password|token|secret)\s*[:=]/i;
export class ActionValidator {
  validate(request: ActionRequest, action?: RegisteredAction) {
    if (!action) return { valid: false as const, message: "This action is not available." };
    if (request.actionId !== action.identifier || request.category !== action.category) return { valid: false as const, message: "The action request is invalid." };
    if (!Number.isFinite(request.confidence) || request.confidence < 0 || request.confidence > 1) return { valid: false as const, message: "The action confidence is invalid." };
    if (Object.keys(request.parameters).some(key => unsafeKey.test(key))) return { valid: false as const, message: "The action contains restricted parameters." };
    if (Object.values(request.parameters).some(value => typeof value === "string" && unsafeValue.test(value))) return { valid: false as const, message: "The action contains unsafe parameters." };
    if (!action.validateParameters(request.parameters)) return { valid: false as const, message: "The action parameters are invalid." };
    return { valid: true as const };
  }
}
