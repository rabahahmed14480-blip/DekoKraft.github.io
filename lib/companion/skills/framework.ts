import { randomUUID } from "node:crypto";
import type { CompanionActionFramework } from "../actions/framework.ts";
import type { ActionRequest } from "../actions/types.ts";
import { builtinSkills } from "./builtins.ts";
import { SkillRegistry } from "./registry.ts";
import { SkillRouter } from "./router.ts";
import type { CompanionSkill, SkillContext, SkillExecution } from "./types.ts";

export class CompanionSkillsFramework {
  readonly registry: SkillRegistry;
  readonly router: SkillRouter;

  constructor(input: { skills?: CompanionSkill[] } = {}) {
    this.registry = new SkillRegistry();
    for (const skill of input.skills ?? builtinSkills) this.registry.register(skill);
    this.router = new SkillRouter(this.registry);
  }

  register(skill: CompanionSkill) { return this.registry.register(skill); }
  resolveSkill(context: SkillContext) { return this.router.resolveSkill(context); }
  execute(context: SkillContext) { return this.router.execute(context); }

  toActionRequests(execution: SkillExecution, actions: CompanionActionFramework): ActionRequest[] {
    return (execution.result?.recommendedActions ?? []).flatMap(recommendation => {
      if (!actions.registry.get(recommendation.actionId)) return [];
      return [{
        requestId: randomUUID(),
        actionId: recommendation.actionId,
        category: recommendation.category,
        parameters: { ...recommendation.parameters },
        confidence: recommendation.confidence,
        requiresConfirmation: recommendation.requiresConfirmation,
        reason: recommendation.reason.slice(0, 500),
      }];
    });
  }
}
