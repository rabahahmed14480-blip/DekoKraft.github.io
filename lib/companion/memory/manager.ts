import { randomUUID } from "node:crypto";
import type { ContextSnapshot } from "../page-context/types.ts";
import { MemoryCleaner } from "./cleaner.ts";
import { MemoryResolver } from "./resolver.ts";
import { ReferenceResolver } from "./referenceResolver.ts";
import { MemorySerializer } from "./serializer.ts";
import type { ConversationMemory, ConversationMemorySnapshot, ManagedMemory, MemoryEntry, MemoryEntrySource, MemoryEntryType, MemoryEvent, MemoryType, MemoryValue, ResolvedReference } from "./types.ts";

export class SessionMemoryManager {
  private memories = new Map<string, ConversationMemory>();
  private persistent = new Map<string, Map<string, ManagedMemory>>();
  private scopes = new Map<string, string>();
  private versions = new Map<string, number>();
  private listeners = new Set<(event: MemoryEvent) => void>();
  private cleaner: MemoryCleaner; private resolver: MemoryResolver; private references: ReferenceResolver; private serializer = new MemorySerializer();
  private readonly options: { ttlMs?: number; entryTtlMs?: number; maxEntries?: number; now?: () => number };
  constructor(options: { ttlMs?: number; entryTtlMs?: number; maxEntries?: number; now?: () => number } = {}) {
    this.options = options;
    this.cleaner = new MemoryCleaner(options.maxEntries ?? 60); this.resolver = new MemoryResolver(); this.references = new ReferenceResolver();
  }
  start(sessionId: string, context: ContextSnapshot, scope = sessionId) {
    const now = this.now(); const persisted = [...(this.persistent.get(scope)?.values() ?? [])].map(item => structuredClone(item));
    const memory: ConversationMemory = { sessionId, contextFingerprint: context.fingerprint, route: context.route, workspaceKey: this.workspaceKey(context), entries: [], managed: persisted, state: { startedAt: this.iso(now) }, currentIntent: "unknown", createdAt: this.iso(now), updatedAt: this.iso(now), expiresAt: this.iso(now + (this.options.ttlMs ?? 30 * 60_000)) };
    this.scopes.set(sessionId, scope); this.memories.set(sessionId, memory); this.versions.set(sessionId, 1); this.captureContext(sessionId, context); this.emit("MemoryLoaded", sessionId, undefined, { persistentCount: persisted.length }); return this.current(sessionId);
  }
  syncContext(sessionId: string, context: ContextSnapshot) {
    const memory = this.require(sessionId); const workspaceKey = this.workspaceKey(context);
    if (memory.route !== context.route || memory.workspaceKey !== workspaceKey) {
      const scope = this.scopes.get(sessionId) ?? sessionId;
      this.clear(sessionId, "context_changed");
      return this.start(sessionId, context, scope);
    }
    for (const entry of memory.entries) entry.contextFingerprint = context.fingerprint;
    memory.contextFingerprint = context.fingerprint; memory.updatedAt = this.iso(this.now()); this.captureContext(sessionId, context); return this.current(sessionId);
  }
  rememberTurn(sessionId: string, input: { question: string; answer: string; topic?: string; command?: string; interrupted?: boolean }) {
    const memory = this.require(sessionId); const intent = this.resolver.detectIntent(input.question); memory.currentIntent = intent;
    memory.state.currentTopic = this.cleaner.sanitize(input.topic ?? this.resolver.topic(input.question)) as string; memory.state.pendingQuestion = undefined;
    memory.state.lastSuccessfulResponse = input.interrupted ? memory.state.lastSuccessfulResponse : this.cleaner.sanitize(input.answer) as string;
    memory.state.interruptedResponse = input.interrupted ? this.cleaner.sanitize(input.answer) as string : undefined;
    this.add(sessionId, "question", input.question, "conversation", .95);
    this.add(sessionId, "answer", input.answer, "conversation", .95);
    this.add(sessionId, "topic", memory.state.currentTopic, "conversation", .85);
    this.add(sessionId, "intent", intent, "conversation", .8);
    if (input.command) this.add(sessionId, "navigation", input.command, "command", .9);
    this.touch(memory); return this.current(sessionId);
  }
  rememberComparison(sessionId: string, items: MemoryValue[]) { return this.add(sessionId, "comparison", { items: items.slice(0, 2) }, "conversation", .95); }
  rememberReading(sessionId: string, input: { section?: string; paragraph?: number; progress: number; resumePosition?: number }) { return this.add(sessionId, "reading", { section: input.section ?? null, paragraph: input.paragraph ?? null, progress: Math.max(0, Math.min(100, input.progress)), resumePosition: input.resumePosition ?? null }, "reading_service", 1); }
  rememberAction(sessionId: string, input: { actionId: string; status: string }) { return this.add(sessionId, "navigation", { actionId: input.actionId, status: input.status }, "command", .95); }
  resolveReferences(sessionId: string, text: string): ResolvedReference[] { const memory = this.require(sessionId); const result = this.references.resolve(text, memory); this.emit(result.length ? "ReferenceResolved" : "ReferenceFailed", sessionId, undefined, { count: result.length }); return structuredClone(result); }
  current(sessionId: string): ConversationMemorySnapshot { const memory = this.cleanAndRequire(sessionId); return this.serializer.serialize(memory, this.versions.get(sessionId) ?? 1); }
  recent(sessionId: string, limit = 10) { return this.current(sessionId).entries.slice(-Math.max(1, Math.min(limit, 30))); }
  currentIntent(sessionId: string) { return this.current(sessionId).currentIntent; }
  currentTopic(sessionId: string) { return this.current(sessionId).state.currentTopic; }
  load(sessionId: string, key: string): ManagedMemory | undefined;
  load(sessionId: string): ManagedMemory[];
  load(sessionId: string, key?: string): ManagedMemory | ManagedMemory[] | undefined {
    const items = this.current(sessionId).managed.filter(item => !key || item.key === key);
    this.emit("MemoryLoaded", sessionId, undefined, { count: items.length });
    return key ? items[0] : items;
  }
  save(sessionId: string, input: { key: string; value: MemoryValue; type?: MemoryType; ttlMs?: number }) {
    const memory = this.require(sessionId); const now = this.now(); const type = input.type ?? "working";
    const item: ManagedMemory = { key: input.key, type, value: this.cleaner.sanitize(input.value), createdAt: this.iso(now), updatedAt: this.iso(now), expiresAt: type === "expiring" ? this.iso(now + (input.ttlMs ?? this.options.entryTtlMs ?? 15 * 60_000)) : undefined, protected: type === "protected" };
    memory.managed = memory.managed.filter(existing => existing.key !== item.key); memory.managed.push(item);
    this.persist(sessionId, item); this.touch(memory); this.emit("MemoryUpdated", sessionId, undefined, { operation: "save", key: item.key, type }); return structuredClone(item);
  }
  update(sessionId: string, key: string, value: MemoryValue) {
    const memory = this.require(sessionId); const item = memory.managed.find(candidate => candidate.key === key);
    if (!item) throw new Error("MEMORY_KEY_NOT_FOUND");
    item.value = this.cleaner.sanitize(value); item.updatedAt = this.iso(this.now()); this.persist(sessionId, item); this.touch(memory);
    this.emit("MemoryUpdated", sessionId, undefined, { operation: "update", key }); return structuredClone(item);
  }
  forget(sessionId: string, key: string) {
    const memory = this.require(sessionId); const item = memory.managed.find(candidate => candidate.key === key);
    if (!item) return false; if (item.protected) throw new Error("PROTECTED_MEMORY_CANNOT_BE_FORGOTTEN");
    memory.managed = memory.managed.filter(candidate => candidate.key !== key); this.persistent.get(this.scopes.get(sessionId) ?? sessionId)?.delete(key);
    this.touch(memory); this.emit("MemoryUpdated", sessionId, undefined, { operation: "forget", key }); return true;
  }
  summarize(sessionId: string) {
    const memory = this.current(sessionId); const parts = [memory.state.currentTopic && `Topic: ${memory.state.currentTopic}`, memory.state.currentObjective && `Objective: ${memory.state.currentObjective}`, ...memory.entries.filter(item => item.type === "question" || item.type === "answer").slice(-6).map(item => `${item.type}: ${String(item.value)}`)].filter(Boolean);
    const summary = parts.join("\n").slice(0, 4_000); this.save(sessionId, { key: "conversation-summary", value: summary, type: "working" });
    this.emit("MemorySummarized", sessionId, undefined, { sourceEntries: memory.entries.length, characters: summary.length }); return summary;
  }
  compress(sessionId: string) {
    const summary = this.summarize(sessionId); const memory = this.require(sessionId);
    memory.entries = memory.entries.filter(item => !["question", "answer"].includes(item.type)).slice(-Math.max(1, Math.floor((this.options.maxEntries ?? 60) / 2)));
    this.touch(memory); return { summary, remainingEntries: memory.entries.length };
  }
  clear(sessionId: string, reason = "explicit") { if (!this.memories.has(sessionId)) return; this.memories.delete(sessionId); this.versions.delete(sessionId); this.scopes.delete(sessionId); this.emit("MemoryCleared", sessionId, undefined, { reason }); }
  cleanExpired() { const now = this.now(); for (const [sessionId, memory] of this.memories) { if (Date.parse(memory.expiresAt) <= now) { this.memories.delete(sessionId); this.versions.delete(sessionId); this.emit("MemoryExpired", sessionId); } else this.cleaner.clean(memory, now); } }
  subscribe(listener: (event: MemoryEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  count() { this.cleanExpired(); return this.memories.size; }

  private captureContext(sessionId: string, context: ContextSnapshot) { for (const entry of this.resolver.contextEntries(context)) this.add(sessionId, entry.type, entry.value, entry.source, entry.confidence); }
  private add(sessionId: string, type: MemoryEntryType, value: MemoryValue, source: MemoryEntrySource, confidence: number) {
    const memory = this.require(sessionId); const now = this.now(); const safe = this.cleaner.sanitize(value);
    const existing = [...memory.entries].reverse().find(entry => entry.type === type && entry.source === source && JSON.stringify(entry.value) === JSON.stringify(safe));
    if (existing) { existing.updatedAt = this.iso(now); existing.expiresAt = this.iso(now + (this.options.entryTtlMs ?? 15 * 60_000)); existing.confidence = Math.max(existing.confidence, confidence); this.emit("MemoryUpdated", sessionId, existing.id); }
    else { const entry: MemoryEntry = { id: randomUUID(), type, value: safe, confidence: Math.max(0, Math.min(1, confidence)), createdAt: this.iso(now), updatedAt: this.iso(now), expiresAt: this.iso(now + (this.options.entryTtlMs ?? 15 * 60_000)), source, contextFingerprint: memory.contextFingerprint }; memory.entries.push(entry); this.emit("MemoryCreated", sessionId, entry.id); }
    this.touch(memory); this.cleaner.clean(memory, now); return this.current(sessionId);
  }
  private cleanAndRequire(sessionId: string) { this.cleanExpired(); const memory = this.require(sessionId); const now = this.now(); this.cleaner.clean(memory, now); const expired = memory.managed.filter(item => item.expiresAt && Date.parse(item.expiresAt) <= now); memory.managed = memory.managed.filter(item => !item.expiresAt || Date.parse(item.expiresAt) > now); for (const item of expired) this.emit("MemoryExpired", sessionId, undefined, { key: item.key }); return memory; }
  private require(sessionId: string) { const memory = this.memories.get(sessionId); if (!memory) throw new Error("CONVERSATION_MEMORY_NOT_FOUND"); return memory; }
  private touch(memory: ConversationMemory) { memory.updatedAt = this.iso(this.now()); memory.expiresAt = this.iso(this.now() + (this.options.ttlMs ?? 30 * 60_000)); this.versions.set(memory.sessionId, (this.versions.get(memory.sessionId) ?? 0) + 1); }
  private workspaceKey(context: ContextSnapshot) { return context.workspace ? `${context.workspace.name}:${context.workspace.editingMode}:${context.workspace.readOnly}` : undefined; }
  private persist(sessionId: string, item: ManagedMemory) { if (item.type !== "persistent" && item.type !== "protected") return; const scope = this.scopes.get(sessionId) ?? sessionId; const values = this.persistent.get(scope) ?? new Map<string, ManagedMemory>(); values.set(item.key, structuredClone(item)); this.persistent.set(scope, values); }
  private now() { return this.options.now?.() ?? Date.now(); }
  private iso(value: number) { return new Date(value).toISOString(); }
  private emit(type: MemoryEvent["type"], sessionId: string, entryId?: string, metadata: MemoryEvent["metadata"] = {}) { const event: MemoryEvent = { type, sessionId, entryId, occurredAt: this.iso(this.now()), metadata }; for (const listener of this.listeners) listener(event); }
}

export { SessionMemoryManager as MemoryManager };
