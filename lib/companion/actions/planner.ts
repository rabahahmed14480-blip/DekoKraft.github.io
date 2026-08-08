import { randomUUID } from "node:crypto";
import type { ReasoningAction } from "../orchestrator/types.ts";
import type { ActionCategory, ActionRequest } from "./types.ts";

const mapping: Record<ReasoningAction["type"], { id: string; category: ActionCategory }> = {
  read_page: { id: "StartReading", category: "reading" }, open_product: { id: "OpenProduct", category: "shopping" },
  start_comparison: { id: "CompareProducts", category: "shopping" }, navigate: { id: "OpenPage", category: "navigation" },
  open_settings: { id: "OpenSettings", category: "settings" }, recommend_service: { id: "RecommendService", category: "system" },
};
export class ActionPlanner {
  plan(actions: ReasoningAction[]): ActionRequest[] {
    return actions.map(action => ({ requestId: randomUUID(), actionId: mapping[action.type].id, category: mapping[action.type].category, parameters: { ...(action.target ? { target: action.target } : {}), ...(action.serviceId ? { serviceId: action.serviceId } : {}) }, confidence: 1, requiresConfirmation: action.requiresConfirmation, reason: action.label.slice(0, 500) }));
  }
}
