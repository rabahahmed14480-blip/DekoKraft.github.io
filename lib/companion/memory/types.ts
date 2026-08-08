import type { ContextSnapshot } from "../page-context/types.ts";

export type MemoryEntryType = "entity" | "topic" | "question" | "answer" | "selection" | "workspace" | "recommendation" | "intent" | "comparison" | "navigation" | "reading";
export type MemoryEntrySource = "conversation" | "page_context" | "selection" | "workspace" | "reading_service" | "command";
export type MemoryType = "session" | "working" | "persistent" | "protected" | "expiring";
export type MemoryValue = string | number | boolean | null | { [key: string]: MemoryValue } | MemoryValue[];
export type ManagedMemory = {
  key: string; type: MemoryType; value: MemoryValue; createdAt: string; updatedAt: string;
  expiresAt?: string; protected: boolean;
};
export type MemoryEntry = {
  id: string; type: MemoryEntryType; value: MemoryValue; confidence: number;
  createdAt: string; updatedAt: string; expiresAt: string; source: MemoryEntrySource;
  contextFingerprint: string;
};
export type VisitorIntent = "learn" | "purchase" | "design" | "compare" | "search" | "configure" | "read" | "request_help" | "unknown";
export type ConversationMemoryState = {
  startedAt: string; currentTopic?: string; currentObjective?: string; pendingQuestion?: string;
  lastSuccessfulResponse?: string; interruptedResponse?: string;
};
export type ConversationMemory = {
  sessionId: string; contextFingerprint: string; route: string; workspaceKey?: string;
  entries: MemoryEntry[]; state: ConversationMemoryState; currentIntent: VisitorIntent;
  managed: ManagedMemory[];
  createdAt: string; updatedAt: string; expiresAt: string;
};
export type ConversationMemorySnapshot = Readonly<ConversationMemory & { version: number }>;
export type MemoryEventType = "MemoryCreated" | "MemoryLoaded" | "MemoryUpdated" | "MemorySummarized" | "MemoryExpired" | "MemoryCleared" | "ReferenceResolved" | "ReferenceFailed";
export type MemoryEvent = { type: MemoryEventType; sessionId: string; entryId?: string; occurredAt: string; metadata: Record<string, string | number | boolean> };
export type ResolvedReference = { expression: string; entryId: string; type: MemoryEntryType; value: MemoryValue; confidence: number };
export type MemoryContext = Pick<ContextSnapshot, "fingerprint" | "route" | "entity" | "selectedObject" | "workspace" | "permissions">;
