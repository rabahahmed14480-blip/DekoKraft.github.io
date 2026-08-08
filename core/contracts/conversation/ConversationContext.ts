import type { ConversationMessage } from "./ConversationMessage";

export interface ConversationContext<TPage = unknown, TMemory = unknown, TUser = unknown, TCompanion = unknown> {
  readonly conversation: readonly ConversationMessage[];
  readonly currentPage: TPage;
  readonly memory: TMemory;
  readonly userContext: TUser;
  readonly selectedCompanion: TCompanion;
  readonly builtAt: string;
}
