import { performance } from "node:perf_hooks";
import type { IntegrationLog } from "./types.ts";

export class IntegrationLogger {
  private entries: IntegrationLog[] = [];
  record(component: string, durationMs: number, status: IntegrationLog["status"], result: string) {
    this.entries = [...this.entries, { timestamp: new Date().toISOString(), component: component.slice(0, 100), durationMs: Math.max(0, durationMs), status, result: result.slice(0, 200) }].slice(-500);
  }
  async measure<T>(component: string, task: () => Promise<T>, summarize: (result: T) => string): Promise<T> {
    const started = performance.now();
    try { const result = await task(); this.record(component, performance.now() - started, "success", summarize(result)); return result; }
    catch (error) { this.record(component, performance.now() - started, "failure", error instanceof Error ? error.message : "failed"); throw error; }
  }
  measureSync<T>(component: string, task: () => T, summarize: (result: T) => string): T {
    const started = performance.now();
    try { const result = task(); this.record(component, performance.now() - started, "success", summarize(result)); return result; }
    catch (error) { this.record(component, performance.now() - started, "failure", error instanceof Error ? error.message : "failed"); throw error; }
  }
  snapshot() { return structuredClone(this.entries); }
}

