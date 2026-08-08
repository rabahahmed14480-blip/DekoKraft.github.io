import type { ConversationMemory, MemoryEntry, ResolvedReference } from "./types.ts";

const patterns = {
  current: /\b(this|that|it|same (?:product|design|report)|هذا|هذه|ذلك|تلك|نفس (?:المنتج|التصميم|التقرير)|ceci|cela|es|dies)\b/i,
  plural: /\b(them|these|those|هذه العناصر|هؤلاء|eux|sie)\b/i,
  previous: /\b(previous|previous one|last one|السابق|السابقة|الأخير|précédent|vorherig)\b/i,
  first: /\b(first|the first|الأول|الأولى|premier|erste)\b/i,
  second: /\b(second|the second|الثاني|الثانية|deuxième|zweite)\b/i,
};
const recent = (entries: MemoryEntry[], types: MemoryEntry["type"][]) => [...entries].reverse().find(entry => types.includes(entry.type));

export class ReferenceResolver {
  resolve(text: string, memory: ConversationMemory): ResolvedReference[] {
    const resolved: ResolvedReference[] = []; const comparison = recent(memory.entries, ["comparison"]);
    const comparisonValues = comparison && comparison.value !== null && typeof comparison.value === "object" && !Array.isArray(comparison.value) ? comparison.value.items : undefined;
    const add = (expression: string, entry?: MemoryEntry, value = entry?.value, confidence = entry?.confidence ?? .75) => { if (entry && value !== undefined) resolved.push({ expression, entryId: entry.id, type: entry.type, value, confidence }); };
    if (patterns.first.test(text) && Array.isArray(comparisonValues)) add("first", comparison, comparisonValues[0], .95);
    if (patterns.second.test(text) && Array.isArray(comparisonValues)) add("second", comparison, comparisonValues[1], .95);
    if (patterns.previous.test(text)) add("previous", recent(memory.entries, ["entity", "selection", "answer"]));
    if (patterns.current.test(text)) add("current", recent(memory.entries, ["selection", "entity", "topic"]));
    if (patterns.plural.test(text)) add("plural", comparison ?? recent(memory.entries, ["entity"]));
    return resolved;
  }
}
