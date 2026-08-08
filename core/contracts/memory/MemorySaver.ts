import type { MemoryRecord } from "./MemoryRecord";

export interface MemorySaver {
  save(scopeId: string, memory: MemoryRecord): Promise<void>;
}
