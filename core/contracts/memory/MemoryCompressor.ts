import type { MemoryRecord } from "./MemoryRecord";

export interface MemoryCompressor {
  compress(memories: readonly MemoryRecord[]): Promise<readonly MemoryRecord[]>;
}
