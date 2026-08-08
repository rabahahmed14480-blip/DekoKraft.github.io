import type { CurrentUserSession } from "../auth/sessionTypes.ts";
import { CompanionActionFramework } from "./actions/framework.ts";
import type { ActionRequest } from "./actions/types.ts";
import { CompanionAvatarFramework } from "./avatars/framework.ts";
import type { AvatarEmotion } from "./avatars/types.ts";
import type { AvatarVisualSignal, PhonemeTiming } from "./avatars/types.ts";
import { textInputAdapter, textOutputAdapter, unavailableVoiceInputAdapter, type ConversationInputAdapter, type ConversationOutputAdapter } from "./adapters.ts";
import { ContextResolver } from "./contextResolver.ts";
import { CompanionCharacterFramework } from "./characters/framework.ts";
import type { CharacterUserPreferences } from "./characters/types.ts";
import { conversationManager, ConversationManager } from "./conversationManager.ts";
import { SessionMemoryManager } from "./memory/manager.ts";
import { PageContextProvider } from "./page-context/provider.ts";
import type { PageContextInput } from "./page-context/types.ts";
import { CompanionOrchestrator } from "./orchestrator/orchestrator.ts";
import { ReadingService } from "./readingService.ts";
import { ResponsePipeline } from "./responsePipeline.ts";
import { SpeechComposer } from "./speech/composer.ts";
import type { SpeechDocument } from "./speech/types.ts";
import type { ConversationInputMode, ConversationOutputMode, ConversationPageContext, ReadablePageInput, TextOutput } from "./types.ts";

export class ConversationEngine {
  private contextResolver = new ContextResolver();
  private characters = new CompanionCharacterFramework();
  private actionFramework = new CompanionActionFramework();
  private avatars = new CompanionAvatarFramework();
  private pageContexts = new Map<string, PageContextProvider>();
  private memories = new SessionMemoryManager();
  private orchestrator = new CompanionOrchestrator();
  private pipeline = new ResponsePipeline();
  private readingService = new ReadingService();
  private speechComposer = new SpeechComposer();
  private inputAdapters = new Map<ConversationInputMode, ConversationInputAdapter>([["text", textInputAdapter], ["voice", unavailableVoiceInputAdapter]]);
  private outputAdapters = new Map<ConversationOutputMode, ConversationOutputAdapter>([["text", textOutputAdapter]]);
  private manager: ConversationManager;

  constructor(manager: ConversationManager = conversationManager) { this.manager = manager; }

  createSession(actor: CurrentUserSession, page: ConversationPageContext) {
    const resolved = this.contextResolver.resolve(actor, page);
    const session = this.manager.create(actor, page);
    const provider = new PageContextProvider();
    const snapshot = provider.update(this.toPageContextInput(page, resolved.permissions));
    this.pageContexts.set(session.sessionId, provider);
    this.memories.start(session.sessionId, snapshot, this.memoryScope(actor));
    this.avatars.switchAvatar(session.sessionId, this.characters.current(session.sessionId).profile.avatarBinding);
    return session;
  }

  async process(actor: CurrentUserSession, input: { sessionId: string; text?: string; inputMode?: "text" | "voice"; outputMode?: "text"; pageContext?: Partial<ConversationPageContext> }) {
    const session = this.manager.get(input.sessionId, actor);
    const mode = input.inputMode ?? session.activeInput;
    const adapter = this.inputAdapters.get(mode);
    if (!adapter || !adapter.available) throw new Error(mode === "voice" ? "VOICE_INPUT_PROVIDER_UNAVAILABLE" : "CONVERSATION_INPUT_ADAPTER_UNAVAILABLE");
    const normalized = await adapter.normalize(input.text);
    const page: ConversationPageContext = { pageId: session.pageId, pageType: session.pageType, designId: session.designId, serviceId: session.serviceId, componentId: session.componentId, participantId: session.participantId, locale: session.locale, ...input.pageContext };
    const context = this.contextResolver.resolve(actor, page);
    const contextSnapshot = this.pageContexts.get(session.sessionId)?.update(this.toPageContextInput(page, context.permissions));
    if (contextSnapshot) this.memories.syncContext(session.sessionId, contextSnapshot);
    const resolvedReferences = this.memories.resolveReferences(session.sessionId, normalized.text);
    if (!contextSnapshot) throw new Error("PAGE_CONTEXT_NOT_AVAILABLE");
    const selected = this.characters.current(session.sessionId);
    const reasoning = await this.orchestrator.reason({ actor, page: contextSnapshot, memory: this.memories.current(session.sessionId), session: this.manager.get(session.sessionId, actor), currentQuestion: normalized.text, resolvedReferences, permissions: context.permissions, knowledgeScope: context.knowledgeScope, character: { id: selected.profile.metadata.identifier, tone: selected.profile.tone === "friendly" ? "friendly" : "professional", style: selected.profile.responseStyle, speechStyle: selected.profile.voiceBinding.style, greetingStyle: selected.profile.greeting[session.locale] } });
    let plannedActions = [
      ...this.actionFramework.planner.plan(reasoning.response.actions),
      ...this.orchestrator.skills.toActionRequests(reasoning.skillExecution, this.actionFramework),
    ];
    const userMessage = this.manager.addMessage(session.sessionId, actor, { sender: "user", messageType: mode === "voice" ? "voice" : "text", text: normalized.text, metadata: normalized.metadata, processingState: "resolving_context" });
    this.manager.updateMessage(session.sessionId, actor, userMessage.id, { processingState: "retrieving_knowledge" });
    try {
      const result = await this.pipeline.run({ text: normalized.text, context, session: this.manager.get(session.sessionId, actor), reasoning });
      const structuredAction = result.metadata.structuredAction;
      if (!plannedActions.length && structuredAction && typeof structuredAction === "object") {
        const candidate = structuredAction as { type?: unknown; href?: unknown };
        if (candidate.type === "navigate" && typeof candidate.href === "string") plannedActions = this.actionFramework.planner.plan([{ id: `command-${result.command.type}`, type: candidate.href.includes("settings") ? "open_settings" : "navigate", label: result.command.rawText, target: candidate.href, requiresConfirmation: false }]);
      }
      this.manager.updateMessage(session.sessionId, actor, userMessage.id, { processingState: "completed", metadata: { ...normalized.metadata, contextIncluded: true, contextSnapshotId: contextSnapshot?.snapshotId, resolvedReferences } });
      const outputAdapter = this.outputAdapters.get(input.outputMode ?? session.activeOutput);
      if (!outputAdapter?.available) throw new Error("CONVERSATION_OUTPUT_ADAPTER_UNAVAILABLE");
      const skillSemanticText = result.command.type === "none" || result.command.type === "help" ? reasoning.skillExecution.result?.semanticResponse : undefined;
      const characterResponse = this.characters.transform(session.sessionId, {
        text: skillSemanticText ?? result.text,
        facts: reasoning.skillExecution.result?.usedKnowledge.map(item => item.summary) ?? [],
        confidence: reasoning.response.confidence,
        permissions: context.permissions,
        actions: plannedActions,
        followUpSuggestions: [...reasoning.response.suggestedFollowUp, ...(reasoning.skillExecution.result?.followUpQuestions ?? [])],
      }, {
        language: session.locale,
        conversation: this.manager.get(session.sessionId, actor).messages,
        pageContext: contextSnapshot,
        temporaryMemory: this.memories.current(session.sessionId),
      });
      const emotionByTone: Record<typeof characterResponse.tone, AvatarEmotion> = { professional: "neutral", friendly: "happy", creative: "surprised", educational: "neutral", minimal: "neutral", persuasive: "happy" };
      const avatarFrame = this.avatars.render(session.sessionId, { emotion: emotionByTone[characterResponse.tone], energy: result.messageType === "command" ? .8 : .6, confidence: characterResponse.confidence, interactionType: "speaking" });
      const output = await outputAdapter.deliver(characterResponse.text, context) as TextOutput;
      const companionMessage = this.manager.addMessage(session.sessionId, actor, { sender: "companion", messageType: result.messageType, text: characterResponse.text, metadata: { ...result.metadata, plannedActions, character: { id: characterResponse.characterId, tone: characterResponse.tone, responseStyle: characterResponse.responseStyle, avatarBinding: characterResponse.avatarBinding }, avatar: { id: avatarFrame.avatarId, state: avatarFrame.state, expression: avatarFrame.expression.id, gesture: avatarFrame.gesture.id }, semanticText: characterResponse.semanticText, outputAdapter: output.adapter }, processingState: "completed" });
      const current = this.manager.get(session.sessionId, actor);
      this.manager.updateMemory(session.sessionId, actor, { previousQuestions: [...current.temporaryMemory.previousQuestions, normalized.text], ...result.memory });
      if (result.state) this.manager.setState(session.sessionId, actor, result.state);
      this.memories.rememberTurn(session.sessionId, { question: normalized.text, answer: result.text, topic: result.memory.currentTopic, command: result.command.type !== "none" ? result.command.type : undefined });
      if (result.state === "reading") this.memories.rememberReading(session.sessionId, { section: result.memory.currentTopic, progress: 0 });
      return { session: this.snapshot(actor, session.sessionId), userMessage, companionMessage, output, command: result.command, plannedActions, characterResponse, avatarFrame, contextSnapshot, memory: this.memories.current(session.sessionId), resolvedReferences, reasoning: { providerId: reasoning.providerId, providerAvailable: reasoning.providerAvailable, knowledgeAvailable: reasoning.knowledgeAvailable, response: reasoning.response, skillExecution: reasoning.skillExecution, conversationContext: reasoning.request.companionContext }, context: { pageId: context.page.pageId, pageType: context.page.pageType, designId: context.currentDesign?.id, serviceId: context.currentService?.id, componentId: context.currentComponent, participantId: context.participantId, permissions: context.permissions, language: context.language, direction: context.direction } };
    } catch (error) {
      this.manager.updateMessage(session.sessionId, actor, userMessage.id, { processingState: "failed", metadata: { error: error instanceof Error ? error.message : "conversation-failed" } });
      this.manager.setState(session.sessionId, actor, "failed");
      throw error;
    }
  }

  snapshot(actor: CurrentUserSession, sessionId: string) { return structuredClone(this.manager.get(sessionId, actor)); }
  prepareSpeech(actor: CurrentUserSession, input: { sessionId: string; text?: string; source?: SpeechDocument["source"] }) { const session = this.manager.get(input.sessionId, actor); const text = input.text?.trim() || [...session.messages].reverse().find(message => message.sender === "companion")?.text; if (!text) throw new Error("SPEECH_SOURCE_TEXT_REQUIRED"); const { profile } = this.characters.current(session.sessionId); return this.speechComposer.compose({ text, language: session.locale, voice: { ...profile.voiceBinding, language: session.locale }, style: profile.responseStyle, speed: profile.speechPacing, source: input.source ?? { type: "conversation_reply", sourceId: session.sessionId } }); }
  preparePageSpeech(actor: CurrentUserSession, input: { sessionId: string; content: ReadablePageInput }) { const session = this.manager.get(input.sessionId, actor); const reading = this.readingService.read(input.content, session.locale); return this.speechComposer.compose({ text: this.readingService.toMarkdown(reading), language: session.locale, source: { type: "page_reading", sourceId: session.pageId } }); }
  readCurrentContext(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.pageContexts.get(sessionId)?.getCurrent(); }
  readPreviousContext(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.pageContexts.get(sessionId)?.getPrevious(); }
  readContextHistory(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.pageContexts.get(sessionId)?.getHistory() ?? []; }
  readCurrentMemory(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.memories.current(sessionId); }
  readRecentMemory(actor: CurrentUserSession, sessionId: string, limit?: number) { this.manager.get(sessionId, actor); return this.memories.recent(sessionId, limit); }
  readCurrentIntent(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.memories.currentIntent(sessionId); }
  readCurrentTopic(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.memories.currentTopic(sessionId); }
  loadMemory(actor: CurrentUserSession, sessionId: string, key?: string) { this.manager.get(sessionId, actor); return key === undefined ? this.memories.load(sessionId) : this.memories.load(sessionId, key); }
  saveMemory(actor: CurrentUserSession, sessionId: string, input: Parameters<SessionMemoryManager["save"]>[1]) { this.manager.get(sessionId, actor); return this.memories.save(sessionId, input); }
  updateManagedMemory(actor: CurrentUserSession, sessionId: string, key: string, value: Parameters<SessionMemoryManager["update"]>[2]) { this.manager.get(sessionId, actor); return this.memories.update(sessionId, key, value); }
  forgetMemory(actor: CurrentUserSession, sessionId: string, key: string) { this.manager.get(sessionId, actor); return this.memories.forget(sessionId, key); }
  summarizeMemory(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.memories.summarize(sessionId); }
  compressMemory(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.memories.compress(sessionId); }
  resolveMemoryReferences(actor: CurrentUserSession, sessionId: string, text: string) { this.manager.get(sessionId, actor); return this.memories.resolveReferences(sessionId, text); }
  async executeAction(actor: CurrentUserSession, sessionId: string, request: ActionRequest, confirmed = false) {
    const session = this.manager.get(sessionId, actor); const page = this.pageContexts.get(sessionId)?.getCurrent();
    if (!page) throw new Error("PAGE_CONTEXT_NOT_AVAILABLE");
    const legacyPage: ConversationPageContext = { pageId: page.route, pageType: session.pageType, participantId: session.participantId, locale: session.locale };
    const permissions = this.contextResolver.resolve(actor, legacyPage).permissions;
    const result = await this.actionFramework.execute(request, { sessionId, actor, page, memory: this.memories.current(sessionId), permissions, confirmed });
    this.memories.rememberAction(sessionId, { actionId: request.actionId, status: result.status });
    this.manager.addMessage(sessionId, actor, { sender: "system", messageType: "command", text: result.message, metadata: { actionId: request.actionId, executionStatus: result.status }, processingState: "completed" });
    return result;
  }
  readActionHistory(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.actionFramework.history(sessionId); }
  selectCharacter(actor: CurrentUserSession, sessionId: string, preferences: CharacterUserPreferences) { this.manager.get(sessionId, actor); const selection = this.characters.select(sessionId, preferences); this.avatars.switchAvatar(sessionId, selection.profile.avatarBinding); return selection; }
  readCharacter(actor: CurrentUserSession, sessionId: string) { this.manager.get(sessionId, actor); return this.characters.current(sessionId); }
  synchronizeAvatarSpeech(actor: CurrentUserSession, sessionId: string, phonemes: readonly PhonemeTiming[]) { this.manager.get(sessionId, actor); return this.avatars.synchronizeSpeech(phonemes); }
  renderAvatarState(actor: CurrentUserSession, sessionId: string, signal: AvatarVisualSignal, elapsedMs = 0) { this.manager.get(sessionId, actor); return this.avatars.render(sessionId, signal, elapsedMs); }
  clearMemory(actor: CurrentUserSession, sessionId: string) { const session = this.manager.get(sessionId, actor); this.memories.clear(sessionId); const context = this.pageContexts.get(sessionId)?.getCurrent(); if (context) this.memories.start(sessionId, context); this.manager.updateMemory(sessionId, actor, { previousQuestions: [], currentTopic: undefined, lastExplanation: undefined, pendingCommand: undefined }); return this.memories.current(session.sessionId); }
  prepareContextSpeech(actor: CurrentUserSession, sessionId: string) { const session = this.manager.get(sessionId, actor); const snapshot = this.readCurrentContext(actor, sessionId); if (!snapshot) throw new Error("PAGE_CONTEXT_NOT_AVAILABLE"); const reading = this.readingService.readContext(snapshot); return this.speechComposer.compose({ text: this.readingService.toMarkdown(reading), language: session.locale, source: { type: "page_reading", sourceId: snapshot.pageId } }); }
  endSession(actor: CurrentUserSession, sessionId: string) { this.actionFramework.clearSession(sessionId); this.avatars.clearSession(sessionId); this.characters.clearSession(sessionId); this.memories.clear(sessionId, "session_ended"); this.manager.end(sessionId, actor); this.pageContexts.delete(sessionId); }

  private toPageContextInput(page: ConversationPageContext, permissions: string[]): PageContextInput {
    const flags = {
      canEdit: permissions.some(item => /edit|manage/.test(item)),
      canDelete: permissions.some(item => /delete/.test(item)),
      canPublish: permissions.some(item => /publish/.test(item)),
      canPurchase: page.pageType === "public",
      canShare: true,
      canDownload: permissions.some(item => /view|download/.test(item)),
    };
    return { route: page.pageId.startsWith("/") ? page.pageId : "/", language: page.locale, permissions: flags, metadata: { surface: page.pageType }, visibleSections: [] };
  }
  private memoryScope(actor: CurrentUserSession) { return `${actor.role}:${actor.participantId ?? actor.email ?? actor.name ?? "anonymous"}`; }
}

export const conversationEngine = new ConversationEngine();
