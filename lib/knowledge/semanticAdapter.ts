import type { KnowledgeEntry, KnowledgeScope } from "./types.ts";
export type SemanticKnowledgeQuery={query:string;scope:KnowledgeScope;maximumEntries:number;allowedDomains:KnowledgeEntry["domain"][]};
export const semanticKnowledgeAdapter={available:false,async search(request:SemanticKnowledgeQuery):Promise<KnowledgeEntry[]>{void request;throw new Error("SEMANTIC_KNOWLEDGE_BACKEND_UNAVAILABLE");}};
