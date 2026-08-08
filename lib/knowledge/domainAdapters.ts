import type { CurrentUserSession } from "../auth/sessionTypes.ts";
import { getParticipantRegistry } from "../participants/registry.ts";
import { resolveNetworkConfiguration } from "../page-designs/networkStore.ts";
import { listPageDesigns } from "../page-designs/store.ts";
import { smartServiceRegistry } from "../smart-services/registry.ts";
import { KnowledgeService } from "./service.ts";
import type { KnowledgeDomain, KnowledgeEntry, KnowledgeSourceReference } from "./types.ts";

const source=(sourceType:KnowledgeSourceReference["sourceType"],sourceId:string,sourceVersion?:string):KnowledgeSourceReference=>({sourceType,sourceId,sourceVersion,capturedAt:new Date().toISOString()});
export function backfillOperationalKnowledge(session:CurrentUserSession,root=process.cwd()){
 const service=new KnowledgeService(root);const designs=listPageDesigns(root);let created=0,duplicates=0;
 const add=(input:Omit<KnowledgeEntry,"id"|"status"|"confidence"|"createdAt"|"updatedAt"|"createdBy"|"fingerprint"|"reviews">)=>{const result=service.createDraft(session,input);if(result.duplicate)duplicates++;else created++;};
 const platformFacts=[
  ["Configuration resolution","Participant overrides resolve after group overrides.",source("documentation","partial-network-resolver-v1")],
  ["Branch isolation","Admin and Participant configuration branches are isolated.",source("documentation","design-network-v1")],
  ["Publishing safeguards","Publishing requires approval, passing tests, and a rollback snapshot.",source("documentation","page-design-publish-guards-v2")],
 ] as const;
 for(const[title,summary,reference]of platformFacts)add({domain:"platform",kind:"fact",title,summary,scope:{visibility:"admin_team"},sourceRefs:[reference],relatedEntityRefs:[],tags:["architecture","verified-source"],aiGenerated:false});
 for(const design of designs){
  const latest=design.versions.at(-1);if(latest)add({domain:"design",kind:"summary",title:`Design: ${design.name}`,summary:`${design.sourcePage} design is ${design.status}; ${design.tests.filter(test=>test.state==="passed").length} tests passed.`,scope:{visibility:"admin_team",pageType:design.sourcePage,designId:design.id},sourceRefs:[source("design_version",latest.id,String(latest.versionNumber))],relatedEntityRefs:[{entityType:"design",entityId:design.id}],tags:[design.status,design.sourcePage],aiGenerated:false});
  for(const proposal of design.proposals)add({domain:"ai",kind:"recommendation",title:`Proposal: ${proposal.summary}`,summary:`Human workflow status: ${proposal.status}; risks: ${proposal.risks.join(", ")||"none recorded"}.`,scope:{visibility:"admin_team",pageType:design.sourcePage,designId:design.id},sourceRefs:[source("proposal",proposal.id)],relatedEntityRefs:[{entityType:"proposal",entityId:proposal.id},{entityType:"design",entityId:design.id}],tags:["ai",proposal.status],aiGenerated:true});
  for(const test of design.tests.filter(item=>item.state==="failed"))add({domain:"incident",kind:"warning",title:`Failed test: ${test.name}`,summary:test.summary,content:test.error,scope:{visibility:"admin_team",pageType:design.sourcePage,designId:design.id},sourceRefs:[source("test_result",`${design.id}:${test.id}`,test.finishedAt)],relatedEntityRefs:[{entityType:"design",entityId:design.id}],tags:["test-failure","unresolved"],aiGenerated:false});
 }
 for(const serviceModule of smartServiceRegistry.list())add({domain:"service",kind:"definition",title:`Service: ${serviceModule.name.en}`,summary:serviceModule.description.en,scope:{visibility:"admin_team",serviceId:serviceModule.id},sourceRefs:[source("service_event",`service-contract:${serviceModule.id}`,"1")],relatedEntityRefs:[{entityType:"service",entityId:serviceModule.id}],tags:["smart-service"],aiGenerated:false});
 add({domain:"component",kind:"definition",title:"Shared component version references",summary:"Participant designs reference shared component versions and configuration rather than copied source.",scope:{visibility:"admin_team"},sourceRefs:[source("component_version","shared-component-catalog-v1","1")],relatedEntityRefs:[{entityType:"component",entityId:"shared-components"}],tags:["components","versioning","rtl","responsive"],aiGenerated:false});
 add({domain:"product",kind:"procedure",title:"Smart Product Form evidence boundary",summary:"Completeness and SEO output is advisory until a user verifies product facts.",scope:{visibility:"admin_team",serviceId:"smart-product-form"},sourceRefs:[source("service_event","smart-product-form-contract","1")],relatedEntityRefs:[{entityType:"service",entityId:"smart-product-form"}],tags:["product","advisory"],aiGenerated:false});
 add({domain:"marketing",kind:"procedure",title:"Marketing evidence threshold",summary:"A single campaign result is not promoted to a universal lesson.",scope:{visibility:"admin_team",serviceId:"marketing-assistant"},sourceRefs:[source("service_event","marketing-assistant-contract","1")],relatedEntityRefs:[{entityType:"service",entityId:"marketing-assistant"}],tags:["marketing","evidence"],aiGenerated:false});
 add({domain:"analytics",kind:"definition",title:"Analytics interpretation boundary",summary:"Insights require an observation period, baseline, metric definition, limitations, and evidence strength.",scope:{visibility:"admin_team",serviceId:"analytics-assistant"},sourceRefs:[source("service_event","analytics-assistant-contract","1")],relatedEntityRefs:[{entityType:"service",entityId:"analytics-assistant"}],tags:["analytics","correlation"],aiGenerated:false});
 for(const participant of getParticipantRegistry().slice(0,25)){const resolved=resolveNetworkConfiguration({pageType:"participant",participantId:participant.participantId},root);add({domain:"participant",kind:"summary",title:"Participant page configuration",summary:`Current inheritance contains ${resolved.inheritance.length} levels.`,scope:{visibility:"individual_participant",pageType:"participant",participantId:participant.participantId},sourceRefs:[source("component_version",resolved.versionKey)],relatedEntityRefs:[{entityType:"participant",entityId:participant.participantId}],tags:["configuration","minimal"],aiGenerated:false});}
 return{created,duplicates};
}
export const registeredKnowledgeDomains:KnowledgeDomain[]=["platform","design","component","participant","product","marketing","ai","service","analytics","incident"];
