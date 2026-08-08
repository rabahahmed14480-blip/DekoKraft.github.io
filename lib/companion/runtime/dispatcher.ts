import type { RuntimeEvent } from "./types.ts";

export class RuntimeDispatcher {
  private listeners = new Set<(event: RuntimeEvent) => void>();
  private events: RuntimeEvent[] = [];
  dispatch(event: RuntimeEvent) { this.events = [...this.events, event].slice(-200); for (const listener of this.listeners) listener(event); }
  subscribe(listener: (event: RuntimeEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  history() { return structuredClone(this.events); }
  clear() { this.events = []; this.listeners.clear(); }
}

