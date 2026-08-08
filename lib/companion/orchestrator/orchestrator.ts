import { randomUUID } from "node:crypto";
import { CompanionContextBuilder } from "./contextBuilder.ts";
import { EchoBrainAdapter } from "./echoBrainAdapter.ts";
import { IntentResolver } from "./intentResolver.ts";
import { KnowledgeResolver } from "./knowledgeResolver.ts";
import { ReasoningResultValidator } from "./resultValidator.ts";
import { CompanionSkillsFramework } from "../skills/framework.ts";
import type { EchoBrainReasoningProvider, OrchestratorInput, ReasoningOutcome, ReasoningRequest, ReasoningResponse } from "./types.ts";

const scrub = (text: string) => text.replace(/\b(?:\d[ -]*?){13,19}\b|(?:password|passcode|token|secret|cvv)\s*[:=]\s*\S+/gi, "[redacted]").slice(0, 10_000);
const conversation = (items: OrchestratorInput["session"]["messages"]) => items.map(message => ({ sender: message.sender, text: scrub(message.text).slice(0, 5000), timestamp: message.timestamp, messageType: message.messageType }));
const unavailable = (input: OrchestratorInput, knowledgeAvailable: boolean): ReasoningResponse => {
  const ar = input.session.locale === "ar";
  return { text: ar ? (knowledgeAvailable ? "خدمة الاستدلال غير متاحة حاليًا. تتوفر معرفة موثقة، لكن لا يمكنني استنتاج إجابة جديدة منها الآن." : "خدمة الاستدلال والمعرفة المناسبة غير متاحتين حاليًا. لن أخمّن معلومات عن المنصة.") : (knowledgeAvailable ? "Reasoning is temporarily unavailable. Verified knowledge exists, but I cannot derive a new answer from it right now." : "Reasoning and relevant verified knowledge are unavailable. I will not invent platform facts."), type: "clarification", confidence: 1, missingContext: knowledgeAvailable ? ["reasoning_provider"] : ["reasoning_provider", "verified_knowledge"], knowledgeSources: [], suggestedFollowUp: [], actions: [] };
};

export class CompanionOrchestrator {
  private builder: CompanionContextBuilder; private knowledge: KnowledgeResolver; private intents: IntentResolver; private provider: EchoBrainReasoningProvider; private validator: ReasoningResultValidator;
  readonly skills: CompanionSkillsFramework;
  constructor(input: { builder?: CompanionContextBuilder; knowledge?: KnowledgeResolver; intents?: IntentResolver; provider?: EchoBrainReasoningProvider; validator?: ReasoningResultValidator; skills?: CompanionSkillsFramework } = {}) {
    this.builder = input.builder ?? new CompanionContextBuilder(); this.knowledge = input.knowledge ?? new KnowledgeResolver(); this.intents = input.intents ?? new IntentResolver(); this.provider = input.provider ?? new EchoBrainAdapter(); this.validator = input.validator ?? new ReasoningResultValidator(); this.skills = input.skills ?? new CompanionSkillsFramework();
  }
  async reason(input: OrchestratorInput): Promise<ReasoningOutcome> {
    const knowledge = this.knowledge.resolve(input.actor, { scope: input.knowledgeScope, pageType: input.page.pageType, permissions: input.permissions });
    const intent = this.intents.resolve(input.currentQuestion, input.memory);
    const companionContext = this.builder.build(input, knowledge, intent);
    const request: ReasoningRequest = Object.freeze({ requestId: randomUUID(), conversation: Object.freeze(conversation(companionContext.conversation as OrchestratorInput["session"]["messages"]).map(item => Object.freeze(item))), companionContext, currentQuestion: scrub(input.currentQuestion) });
    let providerSucceeded = false;
    let raw: ReasoningResponse;
    try { raw = this.provider.available ? await this.provider.reason(request) : unavailable(input, knowledge.length > 0); providerSucceeded = this.provider.available; }
    catch { raw = unavailable(input, knowledge.length > 0); }
    let response: ReasoningResponse;
    try { response = this.validator.validate(raw, companionContext); }
    catch { providerSucceeded = false; response = this.validator.validate(unavailable(input, knowledge.length > 0), companionContext); }
    const skillExecution = await this.skills.execute({
      conversation: request.conversation,
      companionContext,
      userIntent: intent,
      currentQuestion: request.currentQuestion,
      pageContext: input.page,
      temporaryMemory: input.memory,
      permissions: input.permissions,
      language: input.session.locale,
      actor: input.actor,
    });
    return { request, response, providerId: this.provider.id, providerAvailable: providerSucceeded, knowledgeAvailable: knowledge.length > 0, skillExecution };
  }
}
