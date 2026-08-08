import type { KnowledgeEntry } from "./types.ts";
export const knowledgeRetentionPolicy:Record<KnowledgeEntry["kind"],{days:number|null;auditCritical:boolean}>={
 fact:{days:null,auditCritical:true},decision:{days:null,auditCritical:true},procedure:{days:null,auditCritical:true},
 lesson:{days:null,auditCritical:true},recommendation:{days:180,auditCritical:false},warning:{days:365,auditCritical:true},
 definition:{days:null,auditCritical:true},result:{days:730,auditCritical:true},relationship:{days:null,auditCritical:true},summary:{days:730,auditCritical:true},
};
export const privacyRules={minimumNecessary:true,credentialsForbidden:true,privateConversationStorage:false,sensitiveReadAudit:true,participantCorrectionSupported:true};
