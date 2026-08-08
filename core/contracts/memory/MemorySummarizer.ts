import type { MemoryRecord } from "./MemoryRecord";

export interface MemorySummarizer {
  summarize(memories: readonly MemoryRecord[]): Promise<string>;
}
