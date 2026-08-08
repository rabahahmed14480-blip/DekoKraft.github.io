import type { ReasoningAction } from "../orchestrator/types.ts";
import type { ActionParameters } from "../actions/types.ts";
import type { CompanionSkill, SkillActionRecommendation, SkillContext, SkillMetadata, SkillResult } from "./types.ts";
import { genericSkills } from "./genericSkills.ts";

type Definition = SkillMetadata & {
  action?: { id: string; category: SkillActionRecommendation["category"]; type: ReasoningAction["type"] };
  followUp: string;
  matches?: RegExp;
};

const safeQuestion = (value: string) => value.replace(/\b(?:password|passcode|token|secret|cvv)\s*[:=]\s*\S+/gi, "[redacted]").slice(0, 500);

class DomainSkill implements CompanionSkill {
  readonly metadata: SkillMetadata;
  private definition: Definition;
  constructor(definition: Definition) { this.definition = definition; this.metadata = definition; }
  canHandle(context: SkillContext) { return this.definition.matches ? this.definition.matches.test(context.currentQuestion) : true; }
  async execute(context: SkillContext): Promise<SkillResult> {
    const knowledge = context.companionContext.knowledge.slice(0, 5);
    const answer = knowledge.length
      ? knowledge.map(item => item.summary).join(" ").slice(0, 2_000)
      : context.language === "ar" ? "لا تتوفر معرفة موثقة كافية لإجابة نهائية." : "There is not enough verified knowledge for a final answer.";
    const parameters: ActionParameters = this.definition.action?.id === "OpenProduct" ? { target: context.pageContext.route } : {};
    const recommendedActions: SkillActionRecommendation[] = this.definition.action ? [{
      actionId: this.definition.action.id,
      category: this.definition.action.category,
      parameters,
      reason: safeQuestion(context.currentQuestion),
      confidence: knowledge.length ? 0.85 : 0.6,
      requiresConfirmation: false,
    }] : [];
    return {
      skillId: this.metadata.identifier,
      summary: `${this.metadata.displayName}: ${safeQuestion(context.currentQuestion)}`,
      answer,
      semanticResponse: answer,
      facts: knowledge.map(item => item.summary),
      recommendations: [this.definition.followUp],
      warnings: knowledge.length ? [] : [context.language === "ar" ? "لا تتوفر معرفة موثقة كافية." : "Verified knowledge is limited."],
      suggestedActions: recommendedActions,
      followUpQuestions: [this.definition.followUp],
      recommendedActions,
      followUpSuggestions: [this.definition.followUp],
      confidence: knowledge.length ? 0.9 : 0.65,
      usedKnowledge: knowledge,
    };
  }
}

const definitions: Definition[] = [
  { identifier: "product", displayName: "Product Skill", description: "Understands product information.", category: "product", supportedIntents: ["learn", "purchase", "compare", "search", "unknown"], supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 600, version: "1.0.0", matches: /\b(product|item|price|material|size|منتج|سعر|خامة|مقاس|produit|produkt)\b/i, action: { id: "OpenProduct", category: "shopping", type: "open_product" }, followUp: "Would you like to open the product?" },
  { identifier: "design", displayName: "Design Skill", description: "Understands designs and workspaces.", category: "design", supportedIntents: ["design", "configure"], supportedPageTypes: ["design_workspace", "project", "dashboard"], supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: ["design_workspace", "project", "dashboard"], supportedEntities: "*", requiredPermissions: [], priority: 100, version: "1.0.0", action: { id: "OpenProject", category: "workspace", type: "navigate" }, followUp: "Would you like to open the design workspace?" },
  { identifier: "reading", displayName: "Reading Skill", description: "Provides page reading guidance.", category: "reading", supportedIntents: ["read"], supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 100, version: "1.0.0", action: { id: "StartReading", category: "reading", type: "read_page" }, followUp: "Should I start reading this page?" },
  { identifier: "shopping", displayName: "Shopping Skill", description: "Supports purchase and comparison journeys.", category: "shopping", supportedIntents: ["purchase", "compare"], supportedPageTypes: ["product", "product_category", "search_results", "shopping_cart", "checkout"], supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: ["product", "product_category", "search_results", "shopping_cart", "checkout"], supportedEntities: "*", requiredPermissions: [], priority: 95, version: "1.0.0", action: { id: "CompareProducts", category: "shopping", type: "start_comparison" }, followUp: "Would you like to compare available products?" },
  { identifier: "search", displayName: "Search Skill", description: "Supports platform search.", category: "search", supportedIntents: ["search"], supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 90, version: "1.0.0", followUp: "Would you like to refine the search?" },
  { identifier: "knowledge", displayName: "Knowledge Skill", description: "Uses verified platform knowledge.", category: "knowledge", supportedIntents: ["learn"], supportedPageTypes: ["knowledge_article", "blog", "help"], supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: ["knowledge_article", "blog", "help"], supportedEntities: "*", requiredPermissions: [], priority: 110, version: "1.0.0", followUp: "Would you like the verified sources?" },
  { identifier: "support", displayName: "Support Skill", description: "Provides support guidance.", category: "support", supportedIntents: ["request_help"], supportedPageTypes: "*", supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: "*", supportedEntities: "*", requiredPermissions: [], priority: 80, version: "1.0.0", action: { id: "OpenDocumentation", category: "support", type: "navigate" }, followUp: "Would you like to open the help center?" },
  { identifier: "marketing", displayName: "Marketing Skill", description: "Supports marketing recommendations.", category: "marketing", supportedIntents: ["learn", "design"], supportedPageTypes: ["administration", "dashboard", "reports"], supportedLanguages: ["ar", "en", "fr", "de"], supportedContexts: ["administration", "dashboard", "reports"], supportedEntities: "*", requiredPermissions: ["admin.dashboard.view"], priority: 70, version: "1.0.0", action: { id: "RecommendService", category: "system", type: "recommend_service" }, followUp: "Would you like a marketing recommendation?" },
];

export const builtinSkills: CompanionSkill[] = [...definitions.map(definition => new DomainSkill(definition)), ...genericSkills];
