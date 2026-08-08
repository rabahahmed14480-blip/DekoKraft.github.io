import { randomUUID } from "node:crypto";
import { getKnowledgeContextForEchoBrain } from "../../knowledge/retrieval.ts";
import type { CurrentUserSession } from "../../auth/sessionTypes.ts";
import type { KnowledgeDomain, KnowledgeScope } from "../../knowledge/types.ts";
import type { CompanionKnowledgeItem } from "./types.ts";

type Loader = typeof getKnowledgeContextForEchoBrain;
export class KnowledgeResolver {
  constructor(privateLoader?: Loader) { this.loader = privateLoader ?? getKnowledgeContextForEchoBrain; }
  private loader: Loader;
  resolve(actor: CurrentUserSession, input: { scope: KnowledgeScope; pageType: string; permissions: string[] }): CompanionKnowledgeItem[] {
    const domains = this.domains(input.pageType);
    try {
      const result = this.loader(actor, { requestId: randomUUID(), actorId: actor.role === "participant" ? actor.participantId ?? "participant" : actor.name ?? "admin", actorPermissions: input.permissions, scope: input.scope, targetEntityRefs: [], allowedDomains: domains, maximumEntries: 12, freshnessRequirement: "current" });
      return result.entries.map(entry => ({ id: entry.id, domain: "authorized", kind: entry.verificationState, title: entry.title, summary: entry.summary, confidence: entry.confidence, sourceIds: entry.sourceRefs.map(source => source.sourceId) }));
    } catch { return []; }
  }
  private domains(pageType: string): KnowledgeDomain[] {
    const base: KnowledgeDomain[] = ["platform", "component", "service"];
    if (/product|category|cart|checkout/.test(pageType)) base.push("product");
    if (/design|project|workspace/.test(pageType)) base.push("design");
    if (/dashboard|administration|reports/.test(pageType)) base.push("analytics");
    return [...new Set(base)];
  }
}
