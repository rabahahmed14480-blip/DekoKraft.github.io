import type { ActionRequest } from "../actions/types.ts";
import type { ContextSnapshot } from "../page-context/types.ts";
import type { ConversationMemorySnapshot } from "../memory/types.ts";
import type { ConversationMessage } from "../types.ts";

export type CharacterTone = "professional" | "friendly" | "creative" | "educational" | "minimal" | "persuasive";
export type CharacterVerbosity = "minimal" | "concise" | "balanced" | "detailed";
export type CharacterSource = "builtin" | "premium" | "marketplace" | "brand" | "enterprise" | "custom";
export type CharacterConfidenceStyle = "measured" | "warm" | "creative" | "reassuring" | "direct" | "consultative";
export type CharacterEmojiPolicy = "never" | "minimal" | "contextual";

export type CharacterMetadata = Readonly<{
  identifier: string;
  displayName: string;
  description: string;
  version: string;
  source: CharacterSource;
}>;

export type CharacterVoiceProfile = Readonly<{
  id: string;
  style: string;
  speed: number;
  pitch: number;
  provider: string;
}>;

export type CharacterProfile = Readonly<{
  metadata: CharacterMetadata;
  greeting: Readonly<Record<"ar" | "en" | "fr" | "de", string>>;
  farewell: Readonly<Record<"ar" | "en" | "fr" | "de", string>>;
  tone: CharacterTone;
  verbosity: CharacterVerbosity;
  professionalism: number;
  humorLevel: number;
  empathyLevel: number;
  confidenceStyle: CharacterConfidenceStyle;
  preferredVocabulary: readonly string[];
  forbiddenVocabulary: readonly string[];
  responseStyle: string;
  speechPacing: number;
  speechPauses: Readonly<{ sentence: number; paragraph: number; emphasis: number }>;
  emojiPolicy: CharacterEmojiPolicy;
  voiceBinding: CharacterVoiceProfile;
  avatarBinding: string;
}>;

export type CharacterUserPreferences = Readonly<{
  characterId?: string;
  verbosity?: CharacterVerbosity;
  disableConversationalLead?: boolean;
}>;

export type SemanticResponse = Readonly<{
  text: string;
  facts: readonly string[];
  confidence: number;
  permissions: readonly string[];
  actions: readonly ActionRequest[];
  followUpSuggestions: readonly string[];
}>;

export type CharacterContext = Readonly<{
  sessionId: string;
  language: "ar" | "en" | "fr" | "de";
  conversation: readonly Readonly<Pick<ConversationMessage, "sender" | "text" | "timestamp">>[];
  pageContext: ContextSnapshot;
  temporaryMemory: ConversationMemorySnapshot;
  userPreferences: CharacterUserPreferences;
}>;

export type CharacterResponse = Readonly<{
  characterId: string;
  text: string;
  semanticText: string;
  facts: readonly string[];
  confidence: number;
  permissions: readonly string[];
  actions: readonly ActionRequest[];
  followUpSuggestions: readonly string[];
  tone: CharacterTone;
  responseStyle: string;
  speechPacing: number;
  speechPauses: CharacterProfile["speechPauses"];
  emojiPolicy: CharacterEmojiPolicy;
  voiceBinding: CharacterVoiceProfile;
  avatarBinding: string;
}>;
