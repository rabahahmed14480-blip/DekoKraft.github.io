import type { ContextSnapshot } from "../page-context/types.ts";
import type { MemoryEntryType, MemoryValue, VisitorIntent } from "./types.ts";

export class MemoryResolver {
  detectIntent(text: string): VisitorIntent {
    if (/compare|versus|\bvs\b|قارن|مقارنة|comparer|vergleichen/i.test(text)) return "compare";
    if (/buy|purchase|price|اشتر|شراء|سعر|acheter|kaufen/i.test(text)) return "purchase";
    if (/design|color|تصميم|لون|conception|entwurf/i.test(text)) return "design";
    if (/search|find|ابحث|بحث|chercher|suchen/i.test(text)) return "search";
    if (/setting|configure|إعداد|ضبط|paramètre|einstellung/i.test(text)) return "configure";
    if (/read|اقرأ|قراءة|lire|lesen/i.test(text)) return "read";
    if (/help|support|ساعد|مساعدة|aide|hilfe/i.test(text)) return "request_help";
    if (/explain|what|why|اشرح|ما |لماذا|expliquer|warum/i.test(text)) return "learn";
    return "unknown";
  }
  topic(text: string) { return text.replace(/\s+/g, " ").trim().slice(0, 160); }
  contextEntries(context: ContextSnapshot): { type: MemoryEntryType; value: MemoryValue; source: "page_context" | "selection" | "workspace"; confidence: number }[] {
    const entries: { type: MemoryEntryType; value: MemoryValue; source: "page_context" | "selection" | "workspace"; confidence: number }[] = [];
    if (context.entity && this.canRememberEntity(context)) entries.push({ type: "entity", value: { type: context.entity.type, displayName: context.entity.displayName, status: context.entity.status ?? null }, source: "page_context", confidence: 1 });
    if (context.selectedObject) entries.push({ type: "selection", value: { type: context.selectedObject.type, displayName: context.selectedObject.displayName }, source: "selection", confidence: 1 });
    if (context.workspace) entries.push({ type: "workspace", value: { name: context.workspace.name, currentTool: context.workspace.currentTool ?? null, currentSelection: context.workspace.currentSelection ?? null, editingMode: context.workspace.editingMode, readOnly: context.workspace.readOnly }, source: "workspace", confidence: 1 });
    return entries;
  }
  private canRememberEntity(context: ContextSnapshot) {
    if (!context.entity) return false;
    if (context.entity.visibility === "admin") return context.permissions.canViewAdmin === true;
    if (context.entity.visibility === "participant") return context.permissions.canEdit === true || context.permissions.canShare === true;
    return true;
  }
}
