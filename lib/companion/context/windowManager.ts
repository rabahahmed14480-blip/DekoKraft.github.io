import type { ConversationMessage } from "../types.ts";

export type ContextWindowEvent = Readonly<{
  type: "ContextExpired";
  sessionId: string;
  occurredAt: string;
  metadata: Readonly<Record<string, string | number | boolean>>;
}>;

export class ContextWindowManager {
  private listeners = new Set<(event: ContextWindowEvent) => void>();
  private readonly options: { maxMessages?: number; maxCharacters?: number; now?: () => number };
  constructor(options: { maxMessages?: number; maxCharacters?: number; now?: () => number } = {}) { this.options = options; }

  fit(sessionId: string, messages: readonly ConversationMessage[]) {
    const maxMessages = this.options.maxMessages ?? 20;
    const maxCharacters = this.options.maxCharacters ?? 30_000;
    const selected: ConversationMessage[] = [];
    let characters = 0;
    for (const message of [...messages].reverse()) {
      if (selected.length >= maxMessages || characters + message.text.length > maxCharacters) break;
      selected.unshift(message);
      characters += message.text.length;
    }
    const expired = messages.length - selected.length;
    if (expired > 0) this.emit(sessionId, { expiredMessages: expired, retainedMessages: selected.length });
    return selected;
  }

  subscribe(listener: (event: ContextWindowEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private emit(sessionId: string, metadata: ContextWindowEvent["metadata"]) {
    const event: ContextWindowEvent = { type: "ContextExpired", sessionId, occurredAt: new Date(this.options.now?.() ?? Date.now()).toISOString(), metadata };
    for (const listener of this.listeners) listener(event);
  }
}
