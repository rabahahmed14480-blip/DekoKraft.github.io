export interface ConversationMessage {
  readonly id: string;
  readonly sender: string;
  readonly content: string;
  readonly createdAt: string;
}
