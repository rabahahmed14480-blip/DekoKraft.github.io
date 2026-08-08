import type { SkillLifecycleState } from "./types.ts";

export class SkillLifecycle {
  private states = new Map<string, SkillLifecycleState>();
  set(identifier: string, state: SkillLifecycleState) { this.states.set(identifier, state); }
  get(identifier: string) { return this.states.get(identifier); }
  snapshot() { return Object.fromEntries(this.states); }
  remove(identifier: string) { this.states.delete(identifier); }
}

