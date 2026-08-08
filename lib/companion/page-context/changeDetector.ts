import type { ContextChangeEvent, ContextChangeKind, ContextSnapshot } from "./types.ts";

const tracked = ["route", "entity", "selectedObject", "workspace", "permissions", "search", "filters"] as const;
export class ContextChangeDetector {
  detect(current: ContextSnapshot, previous?: ContextSnapshot): ContextChangeEvent[] {
    if (!previous) return [{ type: "ContextLoaded", current, changedFields: ["all"], occurredAt: new Date().toISOString() }];
    if (current.fingerprint === previous.fingerprint) return [];
    const changedFields = tracked.filter(field => JSON.stringify(current[field]) !== JSON.stringify(previous[field]));
    const events: ContextChangeEvent[] = [{ type: "ContextChanged", current, previous, changedFields: [...changedFields], occurredAt: new Date().toISOString() }];
    const mapping: Partial<Record<typeof tracked[number], ContextChangeKind>> = { route: "RouteChanged", entity: "EntityChanged", selectedObject: "SelectionChanged", workspace: "WorkspaceChanged", permissions: "PermissionChanged" };
    for (const field of changedFields) if (mapping[field]) events.push({ type: mapping[field]!, current, previous, changedFields: [field], occurredAt: new Date().toISOString() });
    events.push({ type: "ContextUpdated", current, previous, changedFields: [...changedFields], occurredAt: new Date().toISOString() });
    return events;
  }
}
