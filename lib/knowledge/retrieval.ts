import type { CurrentUserSession } from "../auth/sessionTypes.ts";
import { KnowledgeService } from "./service.ts";
import type { KnowledgeDomain, KnowledgeEntityReference, KnowledgeScope } from "./types.ts";

export type KnowledgeContextRequest={
 requestId:string;actorId:string;actorPermissions:string[];scope:KnowledgeScope;
 targetEntityRefs:KnowledgeEntityReference[];allowedDomains:KnowledgeDomain[];
 maximumEntries:number;freshnessRequirement:"current"|"allow_stale";
};
export function getKnowledgeContextForEchoBrain(session:CurrentUserSession,request:KnowledgeContextRequest,root=process.cwd()){
 if(!request.requestId||!request.actorId||request.maximumEntries<1)throw new Error("KNOWLEDGE_CONTEXT_REQUEST_INVALID");
 const entries=new KnowledgeService(root).getContextForScope(session,{scope:request.scope,allowedDomains:request.allowedDomains,maximumEntries:Math.min(50,request.maximumEntries),freshnessRequirement:request.freshnessRequirement});
 return{requestId:request.requestId,entries,semanticBackendAvailable:false,draftsExcluded:true,conflictsIncluded:true};
}
export function getKnowledgeExplanationContext(session:CurrentUserSession,input:{scope:KnowledgeScope;domains:KnowledgeDomain[];limit?:number},root=process.cwd()){
 return new KnowledgeService(root).getContextForScope(session,{scope:input.scope,allowedDomains:input.domains,maximumEntries:Math.min(20,input.limit??10),freshnessRequirement:"current"});
}
