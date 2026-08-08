import { ContextSerializer } from "./serializer.ts";
import { ContextValidator } from "./validator.ts";
import { pageContextRegistry, PageContextRegistry } from "./registry.ts";
import type { ContextSnapshot, PageContext, PageContextInput } from "./types.ts";

export class PageContextResolver {
  private cache = new Map<string, ContextSnapshot>();
  private validator: ContextValidator; private serializer: ContextSerializer; private registry: PageContextRegistry;
  constructor(input: { registry?: PageContextRegistry; validator?: ContextValidator; serializer?: ContextSerializer } = {}) { this.registry = input.registry ?? pageContextRegistry; this.validator = input.validator ?? new ContextValidator(); this.serializer = input.serializer ?? new ContextSerializer(); }
  resolve(raw: PageContextInput): ContextSnapshot {
    const input = this.validator.validateInput(raw); const registration = input.pageType ? this.registry.list().find(item => item.type === input.pageType) : this.registry.resolve(input.route);
    if (!registration) throw new Error("PAGE_CONTEXT_TYPE_NOT_REGISTERED");
    const existing = this.cache.get(`${input.route}:${input.language}:${JSON.stringify(input)}`);
    if (existing) return existing;
    const now = new Date().toISOString(); const permissions = input.permissions ?? {};
    const summary = this.summarize(registration.type, input.visibleSections ?? [], permissions, Boolean(input.workspace));
    const context: PageContext = {
      pageId: registration.id, pageType: registration.type, route: input.route, title: input.title || registration.title[input.language],
      subtitle: input.subtitle, description: input.description, language: input.language, direction: input.language === "ar" ? "rtl" : "ltr",
      breadcrumbs: input.breadcrumbs ?? [], entity: input.entity, actions: [...(registration.defaultActions ?? []), ...(input.actions ?? [])],
      permissions, workspace: input.workspace, navigation: input.navigation ?? {}, metadata: input.metadata ?? {},
      visibleSections: input.visibleSections ?? [], selectedObject: input.selectedObject ?? null, search: input.search,
      filters: input.filters ?? input.search?.filters ?? {}, sort: input.sort ?? input.search?.sort, summary, createdAt: now, updatedAt: now,
    };
    const snapshot = this.serializer.serialize(this.validator.sanitize(context)); this.cache.set(`${input.route}:${input.language}:${JSON.stringify(input)}`, snapshot);
    if (this.cache.size > 100) this.cache.delete(this.cache.keys().next().value!);
    return snapshot;
  }
  clearCache() { this.cache.clear(); }
  private summarize(type: PageContext["pageType"], sections: PageContext["visibleSections"], permissions: Record<string, boolean>, workspace: boolean) {
    return [`Page type: ${type}.`, `Visible meaningful sections: ${sections.length}.`, `Page is ${permissions.canEdit ? "editable" : "read-only"}.`, ...(permissions.canPurchase ? ["Current visitor can purchase."] : []), ...(workspace ? ["A workspace is active."] : [])];
  }
}
export const pageContextResolver = new PageContextResolver();
