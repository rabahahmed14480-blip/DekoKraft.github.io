import type { RuntimeConversationEngine } from "./types.ts";
import { RuntimeEngine } from "./engine.ts";

export class CompanionRuntime {
  readonly engine: RuntimeEngine;
  constructor(conversation?: RuntimeConversationEngine) { this.engine = new RuntimeEngine(conversation); }
  get state() { return this.engine.snapshot(); }
}

