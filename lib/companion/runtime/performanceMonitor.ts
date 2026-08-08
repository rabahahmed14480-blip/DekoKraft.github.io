import { performance } from "node:perf_hooks";
import type { PerformanceMetric } from "./types.ts";

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  async measure<T>(operation: string, task: () => Promise<T>): Promise<T> {
    const started = performance.now();
    try { const result = await task(); this.record(operation, performance.now() - started, true); return result; }
    catch (error) { this.record(operation, performance.now() - started, false); throw error; }
  }
  record(operation: string, durationMs: number, success: boolean) { this.metrics = [...this.metrics, { operation: operation.slice(0, 100), durationMs, success, recordedAt: new Date().toISOString() }].slice(-500); }
  snapshot() { return structuredClone(this.metrics); }
}

