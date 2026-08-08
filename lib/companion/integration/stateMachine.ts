import type { CompanionOneState } from "./types.ts";

const allowed: Record<CompanionOneState, readonly CompanionOneState[]> = {
  Idle: ["Listening", "Error"],
  Listening: ["Thinking", "Error"],
  Thinking: ["Speaking", "Waiting", "Error"],
  Speaking: ["Waiting", "Error"],
  Waiting: ["Idle", "Error"],
  Error: ["Idle"],
};

export class CompanionOneStateMachine {
  private current: CompanionOneState = "Idle";
  get state() { return this.current; }
  transition(next: CompanionOneState) { if (next !== this.current && !allowed[this.current].includes(next)) throw new Error(`INVALID_COMPANION_ONE_TRANSITION:${this.current}:${next}`); this.current = next; return next; }
}

