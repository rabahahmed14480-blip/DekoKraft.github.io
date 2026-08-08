import type { CurrentUserSession } from "../auth/sessionTypes.ts";
import type { KnowledgeEntry, KnowledgePermission, KnowledgeScope } from "./types.ts";

const all:KnowledgePermission[]=["knowledge.view","knowledge.search","knowledge.create","knowledge.edit_draft","knowledge.verify","knowledge.deprecate","knowledge.archive","knowledge.manage_relationships","knowledge.view_conflicts","knowledge.manage_ingestion","knowledge.view_health","knowledge.view_participant_scope"];
const participant:KnowledgePermission[]=["knowledge.view","knowledge.search","knowledge.create","knowledge.edit_draft"];
export const knowledgePermissions=(session:CurrentUserSession)=>new Set(session.role==="admin"?all:participant);
export function assertKnowledgePermission(session:CurrentUserSession,permission:KnowledgePermission){if(!knowledgePermissions(session).has(permission))throw new Error("KNOWLEDGE_PERMISSION_DENIED");}
export function canReadScope(session:CurrentUserSession,scope:KnowledgeScope){
 if(session.role==="admin")return true;
 return scope.visibility==="individual_participant"&&scope.participantId===session.participantId;
}
export function assertKnowledgeScope(session:CurrentUserSession,scope:KnowledgeScope){if(!canReadScope(session,scope))throw new Error("KNOWLEDGE_SCOPE_DENIED");}
export function filterAuthorizedEntries(session:CurrentUserSession,entries:KnowledgeEntry[]){return entries.filter(entry=>canReadScope(session,entry.scope));}
