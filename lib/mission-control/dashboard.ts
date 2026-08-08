import fs from "node:fs";
import type { CurrentUserSession } from "../auth/sessionTypes.ts";
import { KnowledgeService } from "../knowledge/service.ts";
import { getParticipantRegistry } from "../participants/registry.ts";
import { getDesignNetworkHealth, resolveNetworkConfiguration } from "../page-designs/networkStore.ts";
import { getSnapshotStatus, listPageDesigns } from "../page-designs/store.ts";
import { echoBrainDesignAdapter } from "../page-designs/echobrain";
import { getInterfaceOperations } from "../smart-services/interfaceStore.ts";
import { smartServiceRegistry } from "../smart-services/registry.ts";
import { listMissionOperations } from "./store.ts";

export function buildMissionControlDashboard(session:CurrentUserSession,root=process.cwd()){
 const designs=listPageDesigns(root);const snapshots=getSnapshotStatus(root);const network=getDesignNetworkHealth(root);const knowledge=new KnowledgeService(root);const knowledgeHealth=knowledge.calculateHealth(session);const knowledgeRecommendations=knowledge.search(session,{kind:"recommendation",status:"verified",pageSize:10}).items;const operations=listMissionOperations(root);const participants=getParticipantRegistry();const interfaces=getInterfaceOperations(root);const resolved=resolveNetworkConfiguration({pageType:"admin"},root);const context={session,resolvedConfiguration:resolved};
 const services=smartServiceRegistry.list().map(service=>({id:service.id,name:service.name,status:service.status(context),health:service.health(context),lastExecution:service.history(context).at(-1)?.createdAt??null,recommendations:service.analytics(context).acceptedSuggestions??0,failures:service.health(context).state==="offline"?1:0}));
 const designCounts=Object.fromEntries(["draft","testing","awaiting_approval","published","archived"].map(status=>[status,designs.filter(design=>design.status===status).length]));
 const publishHistory=designs.flatMap(design=>design.publishRecords.map(record=>({id:`${design.id}:${record.publishedAt}`,type:record.status==="rolled_back"?"rollback":"publish",label:`${design.name}: ${record.status}`,createdAt:record.publishedAt,designId:design.id})));
 const designTimeline=designs.flatMap(design=>design.versions.slice(-10).map(version=>({id:version.id,type:"design",label:`${design.name}: ${version.label}`,createdAt:version.createdAt,designId:design.id})));
 const networkTimeline=network.audit.map(event=>({id:event.id,type:event.action.includes("participant")?"participant":"design",label:event.action,createdAt:event.createdAt,designId:event.designId}));
 const knowledgeTimeline=knowledge.search(session,{pageSize:20,includeDeprecated:true}).items.map(entry=>({id:entry.id,type:"knowledge",label:entry.title,createdAt:entry.updatedAt}));
 const timeline=[...publishHistory,...designTimeline,...networkTimeline,...knowledgeTimeline].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,100);
 const alerts=[
  ...(network.brokenLinks?[{id:"broken-links",severity:"high",message:`${network.brokenLinks} broken network links`}]:[]),
  ...(network.circularDependencies?[{id:"cycles",severity:"critical",message:`${network.circularDependencies} circular dependencies`}]:[]),
  ...(knowledgeHealth.conflicts?[{id:"knowledge-conflicts",severity:"high",message:`${knowledgeHealth.conflicts} knowledge conflicts`}]:[]),
  ...designs.flatMap(design=>design.tests.filter(test=>test.required&&test.state==="failed").map(test=>({id:`${design.id}:${test.id}`,severity:"high",message:`${design.name}: ${test.name} failed`}))),
  ...(!echoBrainDesignAdapter.available?[{id:"ai-offline",severity:"medium",message:"EchoBrain backend unavailable"}]:[]),
 ];
 let storageStatus:"online"|"degraded"="online";try{fs.accessSync(root,fs.constants.R_OK|fs.constants.W_OK);}catch{storageStatus="degraded";}
 return{
  generatedAt:new Date().toISOString(),
  platformHealth:{status:alerts.some(alert=>alert.severity==="critical")?"critical":alerts.length?"degraded":"healthy",servicesOnline:services.filter(item=>item.status==="online").length,servicesOffline:services.filter(item=>item.status==="offline").length,databaseStatus:`file-storage:${storageStatus}`,snapshotStatus:snapshots.status==="scheduler_unavailable"?"manual-ready":"ready",schedulerStatus:snapshots.status,cacheStatus:"version-aware-cache-active",aiStatus:echoBrainDesignAdapter.available?"online":"offline"},
  networkHealth:network,
  designOperations:{active:designs.filter(design=>!["archived","snapshot"].includes(design.status)).length,...designCounts},
  smartServices:services,
  knowledgeCenter:knowledgeHealth,
  aiOperations:{echoBrain:echoBrainDesignAdapter.available?"online":"offline",aiCompanion:echoBrainDesignAdapter.available?"online":"offline",activeAnalyses:designs.filter(design=>design.aiState==="analyzing").length,pendingProposals:designs.reduce((sum,design)=>sum+design.proposals.filter(proposal=>proposal.status==="proposed").length,0),runningTasks:operations.tasks.filter(task=>task.status==="in_progress").length},
  publishingCenter:{pendingPublish:designs.filter(design=>design.status==="approved").length,rollbackAvailable:designs.filter(design=>design.status==="published"&&design.publishRecords.some(record=>record.status==="published")).length,snapshotReady:Boolean(snapshots.lastSuccessful),publishHistory:publishHistory.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,30)},
  participantOperations:{participantCount:participants.length,activeGroups:network.activeGroups,customInterfaces:interfaces.privateInterfaces,isolatedOverrides:network.isolatedOverrides},
  alerts,tasks:operations.tasks,approvals:{designs:designs.filter(design=>design.status==="awaiting_approval").map(design=>({id:design.id,label:design.name,type:"design"})),interfaces:interfaces.pendingActivation,knowledge:knowledgeHealth.pendingDrafts,commands:operations.commands.filter(command=>command.status==="awaiting_approval")},
  timeline,
  recommendations:{knowledge:knowledgeRecommendations.map(entry=>({id:entry.id,title:entry.title,summary:entry.summary,source:"knowledge",advisory:true})),echoBrain:[],analytics:[],advisoryOnly:true},
  commands:operations.commands,
 };
}
