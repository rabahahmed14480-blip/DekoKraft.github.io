import type { RuntimeState } from "./types.ts";

const transitions: Record<RuntimeState, readonly RuntimeState[]> = {
  Booting: ["Loading", "Error", "Shutdown"],
  Loading: ["Idle", "Error", "Shutdown"],
  Idle: ["Listening", "Executing", "Speaking", "Sleeping", "Error", "Shutdown"],
  Listening: ["Thinking", "Error", "Shutdown"],
  Thinking: ["Planning", "Error", "Shutdown"],
  Planning: ["Waiting", "Executing", "Speaking", "Error", "Shutdown"],
  Executing: ["Waiting", "Error", "Shutdown"],
  Speaking: ["Waiting", "Error", "Shutdown"],
  Waiting: ["Idle", "Listening", "Error", "Shutdown"],
  Sleeping: ["Booting", "Shutdown"],
  Error: ["Idle", "Booting", "Shutdown"],
  Shutdown: ["Booting"],
};

export class RuntimeStateMachine {
  private currentState: RuntimeState = "Shutdown";
  get state() { return this.currentState; }
  canTransition(next: RuntimeState) { return this.currentState === next || transitions[this.currentState].includes(next); }
  transition(next: RuntimeState) {
    if (!this.canTransition(next)) throw new Error(`INVALID_RUNTIME_TRANSITION:${this.currentState}:${next}`);
    this.currentState = next;
    return this.currentState;
  }
  resetForBoot() { if (this.currentState !== "Shutdown" && this.currentState !== "Sleeping" && this.currentState !== "Error") throw new Error("RUNTIME_ALREADY_ACTIVE"); return this.transition("Booting"); }
}
