import type { ConversationContext } from "../conversation/ConversationContext";

export interface BrainRequest {
  readonly id: string;
  readonly input: string;
  readonly context: ConversationContext;
}
