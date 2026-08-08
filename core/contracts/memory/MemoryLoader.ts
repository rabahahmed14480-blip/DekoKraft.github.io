import type { MemoryRecord } from "./MemoryRecord";

export interface MemoryLoader {
  load(scopeId: string, key?: string): Promise<readonly MemoryRecord[]>;
}
