import type { CompanionSkill, SkillContext, SkillResult } from "./types.ts";
import type { VisitorIntent } from "../memory/types.ts";

const greetingPattern = /^(?:hello|hi|hey|good\s+(?:morning|afternoon|evening)|مرحب[اأً]?|أهل[اأ]\s+وسهل[اأ]|السلام\s+عليكم|bonjour|salut|hallo|guten\s+tag)[.!?\s]*$/i;
const orderPattern = /\b(order|shipment|delivery|tracking|طلب|شحن|توصيل|commande|livraison|bestellung|lieferung)\b/i;
const helpPattern = /\b(help|support|assist|مساعدة|ساعدني|دعم|aide|hilfe)\b/i;
const conversationPattern = /^(?:how are you|thank you|thanks|كيف حالك|شكر[اأً]?|merci|danke)[.!?\s]*$/i;
const allIntents: VisitorIntent[] = ["learn", "purchase", "design", "compare", "search", "configure", "read", "request_help", "unknown"];
type GenericKind = "greeting" | "conversation" | "order" | "help" | "fallback";
const answer = (context: SkillContext, kind: GenericKind) => {
  const ar = context.language === "ar";
  if (kind === "greeting") return ar ? "مرحبًا! كيف يمكنني مساعدتك؟" : "Hello! How can I help?";
  if (kind === "order") return ar ? "يمكنني مساعدتك في طلبك. شاركني مرجع الطلب دون بيانات دفع حساسة." : "I can help with your order. Share the order reference without sensitive payment details.";
  if (kind === "help") return ar ? "أنا هنا للمساعدة. صف ما تريد إنجازه وسأوجّهك إلى الخطوة المناسبة." : "I’m here to help. Describe what you want to accomplish and I’ll guide you to the appropriate next step.";
  if (kind === "conversation") return ar ? "أنا مستعد للمساعدة. أخبرني بما تريد معرفته." : "I’m ready to help. Tell me what you would like to know.";
  return ar ? "لم أفهم الطلب بعد. هل يمكنك توضيحه؟" : "I did not understand the request yet. Could you clarify it?";
};
const result = (context: SkillContext, skillId: string, kind: GenericKind): SkillResult => {
  const semanticResponse = answer(context, kind);
  return {
  skillId,
  summary: kind,
  answer: semanticResponse,
  semanticResponse,
  facts: [],
  recommendations: [],
  warnings: [],
  suggestedActions: [],
  followUpQuestions: [],
  recommendedActions: [],
  followUpSuggestions: [],
  confidence: kind === "greeting" ? 1 : kind === "conversation" ? .75 : .5,
  usedKnowledge: [],
  };
};

export const greetingSkill: CompanionSkill = {
  metadata: { identifier: "greeting", displayName: "Greeting Skill", description: "Handles greetings without domain logic.", category: "greeting", supportedIntents: ["unknown"], supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 1_000, version: "1.0.0" },
  canHandle: context => greetingPattern.test(context.currentQuestion.trim()),
  execute: async context => result(context, "greeting", "greeting"),
};
export const conversationSkill: CompanionSkill = {
  metadata: { identifier: "conversation", displayName: "Conversation Skill", description: "Handles general conversation without domain logic.", category: "conversation", supportedIntents: ["unknown"], supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 100, version: "1.0.0" },
  canHandle: context => conversationPattern.test(context.currentQuestion.trim()),
  execute: async context => result(context, "conversation", "conversation"),
};
export const orderSkill: CompanionSkill = {
  metadata: { identifier: "order", displayName: "Order Skill", description: "Coordinates safe order assistance.", category: "order", supportedIntents: allIntents, supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 800, version: "1.0.0" },
  canHandle: context => orderPattern.test(context.currentQuestion),
  execute: async context => result(context, "order", "order"),
};
export const helpSkill: CompanionSkill = {
  metadata: { identifier: "help", displayName: "Help Skill", description: "Coordinates general help requests.", category: "help", supportedIntents: allIntents, supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 800, version: "1.0.0" },
  canHandle: context => helpPattern.test(context.currentQuestion),
  execute: async context => result(context, "help", "help"),
};
export const fallbackSkill: CompanionSkill = {
  metadata: { identifier: "fallback", displayName: "Fallback Skill", description: "Provides a safe clarification fallback.", category: "fallback", supportedIntents: allIntents, supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 1, version: "1.0.0" },
  canHandle: () => true,
  execute: async context => result(context, "fallback", "fallback"),
};
export const genericSkills = [greetingSkill, orderSkill, helpSkill, conversationSkill, fallbackSkill];
