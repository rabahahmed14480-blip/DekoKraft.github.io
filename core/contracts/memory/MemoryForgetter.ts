export interface MemoryForgetter {
  forget(scopeId: string, key: string): Promise<boolean>;
}
