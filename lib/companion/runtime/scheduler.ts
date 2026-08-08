import { randomUUID } from "node:crypto";
import type { RuntimeTask } from "./types.ts";

export class RuntimeScheduler {
  private tasks = new Map<string, RuntimeTask>();
  schedule(input: Omit<RuntimeTask, "id">) { const task = { ...input, id: randomUUID() }; this.tasks.set(task.id, task); return { ...task }; }
  cancel(id: string) { return this.tasks.delete(id); }
  list() { return [...this.tasks.values()].sort((left, right) => left.dueAt - right.dueAt || right.priority - left.priority).map(task => ({ ...task })); }
  async runDue(now = Date.now()) {
    const due = this.list().filter(task => task.dueAt <= now);
    for (const task of due) { await task.run(); this.tasks.delete(task.id); }
    return due.map(task => task.id);
  }
  clear() { this.tasks.clear(); }
}

