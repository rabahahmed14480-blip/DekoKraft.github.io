import type { PageContext, PageContextAction, PageContextInput, PageContextMetadataValue } from "./types.ts";

const forbidden = /secret|token|password|private|draft|internal|credential|cookie|session/i;
const clean = (value: string, max = 1000) => value
  .replace(/<(script|style|button|nav|menu|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
  .replace(/<([a-z][\w:-]*)\b[^>]*(?:hidden|aria-hidden\s*=\s*["']?true["']?)[^>]*>[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]*>/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, max);
const safeRoute = (value?: string) => value && /^\/[a-z0-9\-._~/%?=&]*$/i.test(value) && !forbidden.test(value) ? value : undefined;

export class ContextValidator {
  validateInput(input: PageContextInput): PageContextInput {
    if (!input.route.startsWith("/")) throw new Error("PAGE_CONTEXT_ROUTE_INVALID");
    return { ...input, route: input.route.slice(0, 500), title: input.title ? clean(input.title, 200) : undefined };
  }
  filterActions(actions: PageContextAction[], permissions: Record<string, boolean>) {
    return actions.filter(action => permissions[action.capability] === true).filter(action => !action.target || Boolean(safeRoute(action.target))).map(action => ({ ...action, label: clean(action.label, 120), target: safeRoute(action.target) }));
  }
  sanitizeMetadata(metadata: Record<string, PageContextMetadataValue>) {
    return Object.fromEntries(Object.entries(metadata).filter(([key]) => !forbidden.test(key)).map(([key, value]) => [clean(key, 80), typeof value === "string" ? clean(value, 500) : value]));
  }
  sanitize(context: PageContext): PageContext {
    const permissions = Object.fromEntries(Object.entries(context.permissions).filter(([key]) => !forbidden.test(key) && context.permissions[key] === true));
    return {
      ...context, pageId: clean(context.pageId, 160), route: safeRoute(context.route) ?? "/", title: clean(context.title, 200),
      subtitle: context.subtitle ? clean(context.subtitle, 300) : undefined, description: context.description ? clean(context.description, 1000) : undefined,
      breadcrumbs: context.breadcrumbs.map(item => ({ label: clean(item.label, 120), route: safeRoute(item.route) })).slice(0, 20),
      entity: context.entity ? { ...context.entity, id: undefined, displayName: clean(context.entity.displayName, 200), summary: context.entity.summary ? clean(context.entity.summary, 800) : undefined, owner: context.entity.owner ? { displayName: clean(context.entity.owner.displayName, 160) } : undefined } : undefined,
      permissions, actions: this.filterActions(context.actions, permissions), metadata: this.sanitizeMetadata(context.metadata),
      visibleSections: context.visibleSections.map(section => ({ ...section, id: clean(section.id, 100), title: clean(section.title, 160), summary: section.summary ? clean(section.summary, 600) : undefined, content: section.content ? clean(section.content, 5000) : undefined })).sort((a, b) => a.readingOrder - b.readingOrder).slice(0, 100),
      selectedObject: context.selectedObject ? { ...context.selectedObject, id: undefined, displayName: clean(context.selectedObject.displayName, 160) } : null,
      workspace: context.workspace ? { ...context.workspace, id: undefined, name: clean(context.workspace.name, 160), currentSelection: context.workspace.currentSelection ? clean(context.workspace.currentSelection, 160) : undefined } : undefined,
      search: context.search ? { ...context.search, text: clean(context.search.text, 300), resultCount: Math.max(0, context.search.resultCount), currentPage: Math.max(1, context.search.currentPage) } : undefined,
    };
  }
}
