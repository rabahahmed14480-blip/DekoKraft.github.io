import type { MemoryCompressor } from "./MemoryCompressor";
import type { MemoryForgetter } from "./MemoryForgetter";
import type { MemoryLoader } from "./MemoryLoader";
import type { MemorySaver } from "./MemorySaver";
import type { MemorySummarizer } from "./MemorySummarizer";
import type { MemoryUpdater } from "./MemoryUpdater";

export interface IMemoryManager {
  readonly loader: MemoryLoader;
  readonly saver: MemorySaver;
  readonly updater: MemoryUpdater;
  readonly forgetter: MemoryForgetter;
  readonly summarizer: MemorySummarizer;
  readonly compressor: MemoryCompressor;
}
