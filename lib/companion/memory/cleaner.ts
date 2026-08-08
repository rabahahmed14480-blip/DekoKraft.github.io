import type { ConversationMemory, MemoryEntry, MemoryValue } from "./types.ts";

const sensitiveKey = /password|passcode|token|secret|payment|card|cvv|iban|private.?note|cookie|credential/i;
const sensitiveValue = /\b(?:\d[ -]*?){13,19}\b|(?:password|passcode|token|secret|cvv)\s*[:=]\s*\S+/gi;
const sanitize = (value: MemoryValue): MemoryValue => {
  if (typeof value === "string") return value.replace(sensitiveValue, "[redacted]").slice(0, 3000);
  if (Array.isArray(value)) return value.slice(0, 20).map(sanitize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !sensitiveKey.test(key)).map(([key, item]) => [key, sanitize(item)]));
  return value;
};
const signature = (entry: Pick<MemoryEntry, "type" | "value" | "source">) => `${entry.type}:${entry.source}:${JSON.stringify(entry.value)}`;

export class MemoryCleaner {
  private readonly limit: number;
  constructor(limit = 60) { this.limit = limit; }
  sanitize(value: MemoryValue) { return sanitize(value); }
  clean(memory: ConversationMemory, now = Date.now()) {
    const seen = new Set<string>(); const entries: MemoryEntry[] = [];
    for (const entry of [...memory.entries].reverse()) {
      if (Date.parse(entry.expiresAt) <= now || entry.contextFingerprint !== memory.contextFingerprint) continue;
      const safe = { ...entry, value: sanitize(entry.value) }; const key = signature(safe);
      if (seen.has(key)) continue; seen.add(key); entries.push(safe);
      if (entries.length >= this.limit) break;
    }
    memory.entries = entries.reverse();
    return memory;
  }
  isSensitiveKey(key: string) { return sensitiveKey.test(key); }
}
