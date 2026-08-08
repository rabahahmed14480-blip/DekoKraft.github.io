import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import type { ActionRequest } from "../actions/types.ts";
import { ConversationEngine } from "../conversationEngine.ts";
import type { ConversationPageContext } from "../types.ts";
import { RuntimeDispatcher } from "./dispatcher.ts";
import { ErrorRecovery } from "./errorRecovery.ts";
import { PerformanceMonitor } from "./performanceMonitor.ts";
import { RuntimeScheduler } from "./scheduler.ts";
import { RuntimeStateMachine } from "./stateMachine.ts";
import type { RuntimeConversationEngine, RuntimeSnapshot, RuntimeState, RuntimeSubsystem } from "./types.ts";

const subsystemNames: RuntimeSubsystem[] = ["EchoBrain", "Skills Framework", "Character Framework", "Avatar Framework", "Speech Layer", "Action Framework", "Conversation Engine"];

export class RuntimeEngine {
  readonly stateMachine = new RuntimeStateMachine();
  readonly scheduler = new RuntimeScheduler();
  readonly dispatcher = new RuntimeDispatcher();
  readonly performance = new PerformanceMonitor();
  readonly recovery = new ErrorRecovery();
  private actor?: CurrentUserSession;
  private sessionId?: string;
  private lastError?: string;
  private conversation: RuntimeConversationEngine;

  constructor(conversation: RuntimeConversationEngine = new ConversationEngine()) { this.conversation = conversation; }

  boot(actor: CurrentUserSession, page: ConversationPageContext) {
    this.transition("Booting");
    this.actor = actor;
    this.transition("Loading");
    const session = this.conversation.createSession(actor, page);
    this.sessionId = session.sessionId;
    this.transition("Idle");
    return this.snapshot();
  }

  async submit(text: string) {
    const { actor, sessionId } = this.requireActive();
    this.transition("Listening"); this.transition("Thinking"); this.transition("Planning");
    try {
      const result = await this.performance.measure("conversation.process", () => this.conversation.process(actor, { sessionId, text }));
      this.transition("Waiting"); this.transition("Idle");
      return result;
    } catch (error) { this.handleError(error); throw error; }
  }

  async execute(request: ActionRequest, confirmed = false) {
    const { actor, sessionId } = this.requireActive();
    this.transition("Executing");
    try {
      const result = await this.performance.measure("action.execute", () => this.conversation.executeAction(actor, sessionId, request, confirmed));
      this.transition("Waiting"); this.transition("Idle");
      return result;
    } catch (error) { this.handleError(error); throw error; }
  }

  prepareSpeech(text?: string) {
    const { actor, sessionId } = this.requireActive();
    this.transition("Speaking");
    try { const result = this.conversation.prepareSpeech(actor, { sessionId, text }); this.transition("Waiting"); this.transition("Idle"); return result; }
    catch (error) { this.handleError(error); throw error; }
  }

  sleep() { this.requireState("Idle"); this.transition("Sleeping"); return this.snapshot(); }
  wake() { if (this.stateMachine.state !== "Sleeping") throw new Error("RUNTIME_NOT_SLEEPING"); this.transition("Booting"); this.transition("Loading"); this.transition("Idle"); return this.snapshot(); }
  shutdown() {
    if (this.actor && this.sessionId) this.conversation.endSession(this.actor, this.sessionId);
    if (this.stateMachine.state !== "Shutdown") this.transition("Shutdown");
    this.actor = undefined; this.sessionId = undefined; this.scheduler.clear();
    return this.snapshot();
  }

  snapshot(): RuntimeSnapshot {
    return { state: this.stateMachine.state, sessionId: this.sessionId, subsystems: Object.fromEntries(subsystemNames.map(name => [name, name === "EchoBrain" ? "unavailable" : "ready"])) as RuntimeSnapshot["subsystems"], lastError: this.lastError, updatedAt: new Date().toISOString() };
  }

  private transition(state: RuntimeState) {
    this.stateMachine.transition(state);
    this.dispatcher.dispatch({ type: "state_changed", state, occurredAt: new Date().toISOString(), metadata: {} });
  }
  private requireState(state: RuntimeState) { if (this.stateMachine.state !== state) throw new Error(`RUNTIME_STATE_REQUIRED:${state}`); }
  private requireActive() { this.requireState("Idle"); if (!this.actor || !this.sessionId) throw new Error("RUNTIME_SESSION_NOT_AVAILABLE"); return { actor: this.actor, sessionId: this.sessionId }; }
  private handleError(error: unknown) {
    this.lastError = error instanceof Error ? error.message.slice(0, 160) : "RUNTIME_OPERATION_FAILED";
    if (this.stateMachine.canTransition("Error")) this.transition("Error");
    const recovery = this.recovery.recover(error);
    if (recovery.recovered && this.stateMachine.canTransition("Idle")) { this.transition("Idle"); this.dispatcher.dispatch({ type: "recovered", state: "Idle", occurredAt: new Date().toISOString(), metadata: { code: recovery.code } }); }
  }
}

