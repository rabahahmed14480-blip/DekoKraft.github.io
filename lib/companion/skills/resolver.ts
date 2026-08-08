import type { SkillContext, SkillResolution } from "./types.ts";
import type { SkillRegistry } from "./registry.ts";

export class SkillResolver {
  resolve(registry: SkillRegistry, context: SkillContext): SkillResolution | undefined {
    const entityType = context.pageContext.entity?.type;
    const candidates = registry.ready().flatMap(skill => {
      if (skill.canHandle && !skill.canHandle(context)) return [];
      const metadata = skill.metadata;
      const matchedIntent = metadata.supportedIntents.includes(context.userIntent);
      if (!matchedIntent) return [];
      if (!metadata.supportedLanguages.includes(context.language)) return [];
      const matchedPage = metadata.supportedContexts === "*" || metadata.supportedContexts.includes(context.pageContext.pageType);
      const matchedEntity = metadata.supportedEntities === "*" || (!!entityType && metadata.supportedEntities.includes(entityType));
      const permitted = metadata.requiredPermissions.every(permission => context.permissions.includes(permission));
      if (!matchedPage || !matchedEntity) return [];
      const score = metadata.priority + (matchedPage ? 100 : 0) + (matchedEntity ? 25 : 0) + (permitted ? 10_000 : 0);
      return [{ skill, score, matchedIntent, matchedPage, matchedEntity, permitted }];
    });
    return candidates.sort((left, right) => right.score - left.score || left.skill.metadata.identifier.localeCompare(right.skill.metadata.identifier))[0];
  }
}
