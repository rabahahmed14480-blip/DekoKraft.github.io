import type { ConversationMessage, ConversationPageContext, ConversationSession } from "../types.ts";
import type { ActionRequest, ExecutionResult } from "../actions/types.ts";

export type CompanionSurfaceMode = "docked" | "page" | "mobile" | "compact";
export type CompanionUIStatus = "ready" | "listening" | "transcribing" | "processing" | "responding" | "speaking" | "paused" | "offline" | "failed";
export type AccompanimentMode = "undecided" | "enabled" | "disabled" | "temporarily_paused";
export type MicrophoneState = "idle" | "requesting_permission" | "listening" | "transcribing" | "processing" | "unavailable" | "failed";

export type TrustedConversationAction = {
  id: string;
  label: string;
  type: "navigate" | "reading_control";
  target: string;
  consequential?: boolean;
  request?: ActionRequest;
};

export type ConversationUIViewModel = {
  sessionId?: string;
  messages: ConversationMessage[];
  draftText: string;
  partialTranscript: string;
  status: CompanionUIStatus;
  inputMode: "text" | "voice";
  outputMode: "text" | "speech";
  microphoneState: MicrophoneState;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  canSend: boolean;
  canStopSpeech: boolean;
  currentPageContext: ConversationPageContext;
  suggestions: string[];
  actions: TrustedConversationAction[];
  error?: string;
  accompanimentMode: AccompanimentMode;
  surfaceMode: CompanionSurfaceMode;
  isOpen: boolean;
  unreadCount: number;
  contextEnabled: boolean;
};

export type ConversationTransport = {
  createSession(page: ConversationPageContext): Promise<ConversationSession>;
  loadSession(sessionId: string): Promise<ConversationSession>;
  submit(sessionId: string, text: string, pageContext?: Partial<ConversationPageContext>): Promise<{ session: ConversationSession; output?: { suggestions?: string[] }; companionMessage?: ConversationMessage }>;
  endSession(sessionId: string): Promise<void>;
  prepareSpeech(sessionId: string, text: string): Promise<{ providerConfigured: boolean }>;
  executeAction(sessionId: string, request: ActionRequest, confirmed: boolean): Promise<ExecutionResult>;
};

export type ConversationUIEvent =
  | "companion_opened" | "companion_closed" | "message_submitted"
  | "microphone_started" | "microphone_stopped" | "response_completed"
  | "speech_played" | "speech_stopped" | "suggestion_selected"
  | "accompaniment_accepted" | "accompaniment_declined" | "error";

export type ConversationUIAnalytics = (event: ConversationUIEvent, metadata?: Record<string, string | number | boolean>) => void;
