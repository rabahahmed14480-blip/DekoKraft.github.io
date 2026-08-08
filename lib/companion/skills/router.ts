import { SkillResolver } from "./resolver.ts";
import type { SkillRegistry } from "./registry.ts";
import type { SkillContext, SkillEvent, SkillEventType, SkillExecution, SkillMetric } from "./types.ts";
import { performance } from "node:perf_hooks";

export class SkillRouter {
  private registry: SkillRegistry;
  private resolver: SkillResolver;
  private listeners = new Set<(event: SkillEvent) => void>();
  private events: SkillEvent[] = [];
  private counters = new Map<string, { executions: number; successes: number; failures: number; totalMs: number }>();
  constructor(registry: SkillRegistry, resolver = new SkillResolver()) { this.registry = registry; this.resolver = resolver; }

  resolveSkill(context: SkillContext) { return this.resolver.resolve(this.registry, context); }
  subscribe(listener: (event: SkillEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  eventHistory() { return structuredClone(this.events); }
  metrics(): SkillMetric[] {
    return [...this.counters].map(([skillId, value]) => ({ skillId, executions: value.executions, successes: value.successes, failures: value.failures, successRate: value.executions ? value.successes / value.executions : 0, failureRate: value.executions ? value.failures / value.executions : 0, averageResponseTimeMs: value.executions ? value.totalMs / value.executions : 0 }));
  }

  async execute(context: SkillContext): Promise<SkillExecution> {
    this.emit("IntentDetected", context, undefined, "success");
    const resolution = this.resolveSkill(context);
    if (!resolution) return { state: "Failed", error: "SKILL_NOT_FOUND" };
    this.emit("SkillResolved", context, resolution.skill.metadata.identifier, "success");
    if (!resolution.permitted) return { resolution, state: "Failed", error: "SKILL_PERMISSION_DENIED" };
    return this.executeResolved(resolution, context, true);
  }

  private async executeResolved(resolution: NonNullable<ReturnType<SkillResolver["resolve"]>>, context: SkillContext, allowFallback: boolean): Promise<SkillExecution> {
    const identifier = resolution.skill.metadata.identifier;
    this.registry.lifecycle.set(identifier, "Executing");
    this.emit("SkillStarted", context, identifier, "success");
    const started = performance.now();
    try {
      const result = await resolution.skill.execute(context);
      const duration = performance.now() - started;
      this.recordMetric(identifier, duration, true);
      this.registry.lifecycle.set(identifier, "Completed");
      this.registry.lifecycle.set(identifier, "Ready");
      this.emit("SkillCompleted", context, identifier, "success", duration);
      return { resolution, result, state: "Completed" };
    } catch {
      const duration = performance.now() - started;
      this.recordMetric(identifier, duration, false);
      this.registry.lifecycle.set(identifier, "Failed");
      this.emit("SkillFailed", context, identifier, "failure", duration);
      const fallback = allowFallback ? this.registry.get("fallback") : undefined;
      if (fallback && this.registry.lifecycle.get("fallback") === "Ready" && fallback.canHandle?.(context) !== false) {
        const fallbackResolution = { skill: fallback, score: 0, matchedIntent: true, matchedPage: true, matchedEntity: true, permitted: true };
        this.emit("SkillResolved", context, "fallback", "success");
        return this.executeResolved(fallbackResolution, context, false);
      }
      return { resolution, state: "Failed", error: "SKILL_EXECUTION_FAILED" };
    }
  }

  private emit(type: SkillEventType, context: SkillContext, skillId: string | undefined, status: SkillEvent["status"], durationMs?: number) {
    const event: SkillEvent = { type, skillId, intent: context.userIntent, occurredAt: new Date().toISOString(), durationMs, status };
    this.events = [...this.events, event].slice(-500);
    for (const listener of this.listeners) listener(event);
  }
  private recordMetric(skillId: string, durationMs: number, success: boolean) {
    const current = this.counters.get(skillId) ?? { executions: 0, successes: 0, failures: 0, totalMs: 0 };
    current.executions += 1; current.totalMs += durationMs;
    if (success) current.successes += 1;
    else current.failures += 1;
    this.counters.set(skillId, current);
  }
}
