import type { ConversationMemorySnapshot } from "../memory/types.ts";
import { ContextWindowManager } from "../context/windowManager.ts";
import type { CompanionContext, CompanionKnowledgeItem, ConversationContextEvent, OrchestratorInput } from "./types.ts";

const freeze = <T>(value: T): T => { if (value && typeof value === "object") { Object.freeze(value); for (const item of Object.values(value as Record<string, unknown>)) freeze(item); } return value; };
const defaultCharacter = { id: "dekokraft-companion", tone: "professional" as const, style: "friendly-calm", speechStyle: "natural", greetingStyle: "warm" };
const scrub = (text: string) => text.replace(/\b(?:\d[ -]*?){13,19}\b|(?:password|passcode|token|secret|cvv)\s*[:=]\s*\S+/gi, "[redacted]").slice(0, 5_000);
const readingState = (memory: ConversationMemorySnapshot) => {
  const entry = [...memory.entries].reverse().find(item => item.type === "reading");
  if (!entry || !entry.value || typeof entry.value !== "object" || Array.isArray(entry.value)) return undefined;
  return { active: true, section: typeof entry.value.section === "string" ? entry.value.section : undefined, progress: typeof entry.value.progress === "number" ? entry.value.progress : undefined };
};

export class CompanionContextBuilder {
  private listeners = new Set<(event: ConversationContextEvent) => void>();
  private readonly windows: ContextWindowManager;
  constructor(windows = new ContextWindowManager()) { this.windows = windows; }
  build(input: OrchestratorInput, knowledge: CompanionKnowledgeItem[], intent: CompanionContext["visitorIntent"]): CompanionContext {
    const selectedCompanion = structuredClone(input.character ?? defaultCharacter);
    const builtAt = new Date().toISOString();
    const currentTurn = { id: `current:${input.session.sessionId}`, sender: "user" as const, text: input.currentQuestion, timestamp: builtAt, messageType: "text" as const, metadata: {}, processingState: "resolving_context" as const };
    const conversation = this.windows.fit(input.session.sessionId, [...input.session.messages, currentTurn]).map(({ sender, text, timestamp, messageType }) => ({ sender, text: scrub(text), timestamp, messageType }));
    const context = freeze({
      contextVersion: 1 as const, conversation, page: input.page, memory: input.memory, conversationState: input.session.state,
      userContext: structuredClone(input.actor), selectedCompanion,
      visitorIntent: intent, knowledge: structuredClone(knowledge), character: selectedCompanion,
      language: input.session.locale, direction: input.session.locale === "ar" ? "rtl" as const : "ltr" as const,
      workspace: input.page.workspace, readingState: readingState(input.memory),
      permissions: [...input.permissions], resolvedReferences: structuredClone(input.resolvedReferences), builtAt,
    });
    const event: ConversationContextEvent = { type: "ContextBuilt", sessionId: input.session.sessionId, occurredAt: context.builtAt };
    for (const listener of this.listeners) listener(event);
    return context;
  }
  subscribe(listener: (event: ConversationContextEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

export { CompanionContextBuilder as ContextBuilder };
