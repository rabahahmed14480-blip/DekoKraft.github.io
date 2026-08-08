import type { ConversationMessage } from "./ConversationMessage";

export interface ConversationSession {
  readonly id: string;
  readonly userId: string;
  readonly state: string;
  readonly messages: readonly ConversationMessage[];
  readonly startedAt: string;
  readonly lastActivityAt: string;
}
