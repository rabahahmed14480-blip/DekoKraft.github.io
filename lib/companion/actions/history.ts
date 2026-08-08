import type { ExecutionHistoryEntry, ExecutionResult } from "./types.ts";

export class ExecutionHistory {
  private sessions = new Map<string, ExecutionHistoryEntry[]>();
  add(sessionId: string, result: ExecutionResult) { const entries = this.sessions.get(sessionId) ?? []; entries.push({ actionId: result.actionId, time: result.completedAt, status: result.status, durationMs: result.durationMs }); this.sessions.set(sessionId, entries.slice(-100)); }
  get(sessionId: string) { return structuredClone(this.sessions.get(sessionId) ?? []); }
  clear(sessionId: string) { this.sessions.delete(sessionId); }
}
