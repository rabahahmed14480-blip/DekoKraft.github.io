import type { RegisteredAction } from "./types.ts";

export class ActionRegistry {
  private actions = new Map<string, RegisteredAction>();
  register(action: RegisteredAction) { if (this.actions.has(action.identifier)) throw new Error("ACTION_ALREADY_REGISTERED"); this.actions.set(action.identifier, action); return this; }
  get(identifier: string) { return this.actions.get(identifier); }
  list() { return [...this.actions.values()]; }
  unregister(identifier: string) { return this.actions.delete(identifier); }
}
