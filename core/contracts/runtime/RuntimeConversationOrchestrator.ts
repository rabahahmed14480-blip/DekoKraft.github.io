import type { ConversationContext } from "../conversation/ConversationContext";
import type { ConversationMessage } from "../conversation/ConversationMessage";

export interface RuntimeConversationOrchestrator {
  process(message: ConversationMessage, context: ConversationContext): Promise<ConversationMessage>;
}
