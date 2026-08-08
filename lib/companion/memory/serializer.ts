import type { ConversationMemory, ConversationMemorySnapshot } from "./types.ts";

const deepFreeze = <T>(value: T): T => { if (value && typeof value === "object") { Object.freeze(value); for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item); } return value; };
export class MemorySerializer {
  serialize(memory: ConversationMemory, version: number): ConversationMemorySnapshot { return deepFreeze({ ...structuredClone(memory), version }); }
}
