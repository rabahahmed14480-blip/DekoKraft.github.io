import type { ConversationMessage, ConversationPageContext } from "../types.ts";
import type { ActionRequest } from "../actions/types.ts";
import { suggestionsForContext } from "./content.ts";
import type { AccompanimentMode, CompanionSurfaceMode, ConversationTransport, ConversationUIAnalytics, ConversationUIViewModel, TrustedConversationAction } from "./types.ts";

const STORAGE_KEY = "dekokraft-companion-session";
const safeAnalytics: ConversationUIAnalytics = (event, metadata = {}) => console.info("[companion-ui]", { event, ...metadata });
const validInternalTarget = (target: string) => /^\/(admin|participant|info|market|studio|about)(\/|$|\?)/.test(target);

export class ConversationUIController {
  private listeners = new Set<() => void>();
  private submittingText?: string;
  private abort?: AbortController;
  private submissionVersion = 0;
  private transport: ConversationTransport;
  private analytics: ConversationUIAnalytics;
  private model: ConversationUIViewModel;

  constructor(input: { transport: ConversationTransport; page: ConversationPageContext; analytics?: ConversationUIAnalytics }) {
    this.transport = input.transport;
    this.analytics = input.analytics ?? safeAnalytics;
    this.model = {
      messages: [], draftText: "", partialTranscript: "", status: "ready", inputMode: "text", outputMode: "text",
      microphoneState: "idle", isListening: false, isSpeaking: false, isProcessing: false, canSend: false,
      canStopSpeech: false, currentPageContext: input.page, suggestions: suggestionsForContext(input.page, input.page.locale),
      actions: [], accompanimentMode: "undecided", surfaceMode: "compact", isOpen: false, unreadCount: 0, contextEnabled: true,
    };
  }

  snapshot = () => this.model;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private update(patch: Partial<ConversationUIViewModel>) { this.model = { ...this.model, ...patch }; this.model.canSend = Boolean(this.model.draftText.trim()) && !this.model.isProcessing; for (const listener of this.listeners) listener(); }

  async initialize() {
    const stored = typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { const session = await this.transport.loadSession(stored); this.update({ sessionId: session.sessionId, messages: session.messages }); return; }
      catch { sessionStorage.removeItem(STORAGE_KEY); }
    }
    await this.newConversation();
  }

  async newConversation() {
    const previous = this.model.sessionId;
    if (previous) await this.transport.endSession(previous).catch(() => undefined);
    const session = await this.transport.createSession(this.model.currentPageContext);
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(STORAGE_KEY, session.sessionId);
    this.update({ sessionId: session.sessionId, messages: [], draftText: "", partialTranscript: "", status: "ready", error: undefined, accompanimentMode: "undecided", unreadCount: 0 });
  }

  setDraft(text: string) { this.update({ draftText: text.slice(0, 10_000) }); }
  reportUnavailable() { this.update({ status: "offline", error: "response_failed", isProcessing: false }); }
  setPageContext(page: ConversationPageContext) { this.update({ currentPageContext: page, suggestions: suggestionsForContext(page, page.locale) }); }
  setContextEnabled(enabled: boolean) { this.update({ contextEnabled: enabled }); }
  setSurface(mode: CompanionSurfaceMode, open = true) { this.update({ surfaceMode: mode, isOpen: open, unreadCount: open ? 0 : this.model.unreadCount }); this.analytics(open ? "companion_opened" : "companion_closed", { mode }); }
  close() { this.setSurface("compact", false); }

  async submit(text = this.model.draftText) {
    const normalized = text.replace(/[ \t]+\n/g, "\n").trim();
    if (!normalized || this.model.isProcessing || this.submittingText === normalized) return;
    if (!this.model.sessionId) await this.initialize();
    const sessionId = this.model.sessionId;
    if (!sessionId) return;
    this.submittingText = normalized;
    const version = ++this.submissionVersion;
    this.update({ draftText: "", partialTranscript: "", isProcessing: true, status: "processing", error: undefined });
    this.analytics("message_submitted", { inputMode: this.model.inputMode });
    try {
      const result = await this.transport.submit(sessionId, normalized, this.model.contextEnabled ? this.model.currentPageContext : undefined);
      if (version !== this.submissionVersion) return;
      const actions = this.extractActions(result.companionMessage);
      this.update({ messages: result.session.messages, suggestions: result.output?.suggestions ?? this.model.suggestions, actions, isProcessing: false, status: "ready", unreadCount: this.model.isOpen ? 0 : this.model.unreadCount + 1 });
      this.analytics("response_completed");
    } catch {
      if (version === this.submissionVersion) this.update({ draftText: normalized, isProcessing: false, status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "failed", error: "response_failed" });
      this.analytics("error", { category: "response" });
    } finally { this.submittingText = undefined; }
  }

  stopGeneration() { this.submissionVersion += 1; this.abort?.abort(); this.abort = undefined; this.submittingText = undefined; this.update({ isProcessing: false, status: "ready" }); }
  receivePartialTranscript(text: string) { this.update({ partialTranscript: text, draftText: text, microphoneState: "listening", status: "listening" }); }
  finalizeTranscript(text: string) { this.update({ partialTranscript: "", draftText: text, inputMode: "voice", microphoneState: "idle", isListening: false, status: "ready" }); }
  async startMicrophone() {
    if (this.model.isSpeaking) this.stopSpeech();
    this.update({ microphoneState: "requesting_permission", error: undefined });
    this.analytics("microphone_started");
    this.update({ microphoneState: "unavailable", isListening: false, status: "ready", error: "microphone_unavailable" });
  }
  cancelMicrophone() { this.update({ microphoneState: "idle", isListening: false, partialTranscript: "", status: "ready" }); this.analytics("microphone_stopped"); }

  async playSpeech(message: ConversationMessage) {
    if (!this.model.sessionId || message.sender !== "companion") return;
    this.update({ isSpeaking: true, canStopSpeech: true, status: "speaking", error: undefined });
    try {
      const result = await this.transport.prepareSpeech(this.model.sessionId, message.text);
      if (!result.providerConfigured) throw new Error("provider-unavailable");
      this.analytics("speech_played");
    } catch {
      this.update({ isSpeaking: false, canStopSpeech: false, status: "ready", error: "speech_unavailable" });
      this.analytics("error", { category: "speech" });
    }
  }
  pauseSpeech() { this.update({ isSpeaking: false, status: "paused", canStopSpeech: true }); }
  resumeSpeech() { this.update({ isSpeaking: true, status: "speaking", canStopSpeech: true }); }
  stopSpeech() { this.update({ isSpeaking: false, status: "ready", canStopSpeech: false }); this.analytics("speech_stopped"); }

  chooseAccompaniment(mode: Exclude<AccompanimentMode, "undecided" | "temporarily_paused">) {
    this.stopSpeech(); this.update({ accompanimentMode: mode });
    this.analytics(mode === "enabled" ? "accompaniment_accepted" : "accompaniment_declined");
  }
  pauseAccompaniment() { this.update({ accompanimentMode: "temporarily_paused" }); }
  async selectSuggestion(value: string) { this.setDraft(value); this.analytics("suggestion_selected"); await this.submit(value); }
  clearConversation() { return this.newConversation(); }

  validateAction(action: TrustedConversationAction) {
    if (action.request) return Boolean(action.request.actionId && action.request.requestId);
    if (action.type === "navigate") return validInternalTarget(action.target);
    return ["read_page", "stop_reading", "continue_reading"].includes(action.target);
  }
  async executeAction(action: TrustedConversationAction, confirmed = false) {
    if (!this.model.sessionId || !action.request || !this.validateAction(action)) throw new Error("ACTION_REQUEST_INVALID");
    return this.transport.executeAction(this.model.sessionId, action.request, confirmed);
  }

  private extractActions(message?: ConversationMessage): TrustedConversationAction[] {
    const planned = message?.metadata.plannedActions;
    if (Array.isArray(planned)) return planned.filter((item): item is ActionRequest => Boolean(item && typeof item === "object" && typeof (item as ActionRequest).actionId === "string" && typeof (item as ActionRequest).requestId === "string")).map(request => ({ id: request.requestId, label: request.reason, type: request.category === "reading" ? "reading_control" : "navigate", target: typeof request.parameters.target === "string" ? request.parameters.target : "", consequential: request.requiresConfirmation, request }));
    const value = message?.metadata.structuredAction;
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    if (item.type !== "navigate" || typeof item.href !== "string" || !validInternalTarget(item.href)) return [];
    return [{ id: `${message?.id}-navigate`, label: item.href.includes("settings") ? "Open settings" : "Open", type: "navigate", target: item.href, consequential: false }];
  }
}

export const conversationHttpTransport: ConversationTransport = {
  async createSession(page) { const response = await fetch("/api/conversation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create_session", page }) }); if (!response.ok) throw new Error("session-create-failed"); return (await response.json()).session; },
  async loadSession(sessionId) { const response = await fetch(`/api/conversation?sessionId=${encodeURIComponent(sessionId)}`); if (!response.ok) throw new Error("session-load-failed"); return (await response.json()).session; },
  async submit(sessionId, text, pageContext) { const response = await fetch("/api/conversation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "message", sessionId, text, pageContext }) }); if (!response.ok) throw new Error("message-failed"); return response.json(); },
  async endSession(sessionId) { await fetch("/api/conversation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "end_session", sessionId }) }); },
  async prepareSpeech(sessionId, text) { const response = await fetch("/api/conversation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prepare_speech", sessionId, text }) }); if (!response.ok) throw new Error("speech-prepare-failed"); return response.json(); },
  async executeAction(sessionId, request, confirmed) { const response = await fetch("/api/conversation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "execute_action", sessionId, request, confirmed }) }); if (!response.ok) throw new Error("action-execution-failed"); return (await response.json()).result; },
};
