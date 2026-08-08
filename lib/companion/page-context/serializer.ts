import type { ContextSnapshot, PageContext } from "./types.ts";

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
};
const hash = (text: string) => { let result = 2166136261; for (let index = 0; index < text.length; index += 1) result = Math.imul(result ^ text.charCodeAt(index), 16777619); return (result >>> 0).toString(36); };
const deepFreeze = <T>(value: T): T => { if (value && typeof value === "object") { Object.freeze(value); for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item); } return value; };

export class ContextSerializer {
  serialize(context: PageContext, version = 1): ContextSnapshot {
    const data = structuredClone(context); const fingerprint = hash(stable({ ...data, updatedAt: undefined }));
    return deepFreeze({ ...data, snapshotId: `context-${fingerprint}-${version}`, version, fingerprint });
  }
  toConversationPayload(snapshot: ContextSnapshot) { return structuredClone(snapshot); }
}
