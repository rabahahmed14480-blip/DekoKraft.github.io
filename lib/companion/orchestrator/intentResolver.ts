import { MemoryResolver } from "../memory/resolver.ts";
import type { ConversationMemorySnapshot, VisitorIntent } from "../memory/types.ts";

export class IntentResolver {
  private memoryResolver = new MemoryResolver();
  resolve(question: string, memory: ConversationMemorySnapshot): VisitorIntent {
    const current = this.memoryResolver.detectIntent(question);
    return current === "unknown" ? memory.currentIntent : current;
  }
}
