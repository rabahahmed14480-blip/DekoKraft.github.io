export interface MemoryUpdater {
  update(scopeId: string, key: string, value: unknown): Promise<void>;
}
