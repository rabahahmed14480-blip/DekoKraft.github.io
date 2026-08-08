import { echoBrainDesignAdapter } from "../page-designs/echobrain";
import { listPageDesigns, getSnapshotStatus } from "../page-designs/store";
import { listNetworkBranch, resolveNetworkConfiguration } from "../page-designs/networkStore";

export function buildSmartServiceKnowledge(input:{participantId?:string}){
 const designs=listPageDesigns();const snapshots=getSnapshotStatus();const resolved=resolveNetworkConfiguration({pageType:"participant",participantId:input.participantId});const branch=listNetworkBranch({participantId:input.participantId});
 const events=[
  ...branch.audit.map(item=>({id:item.id,type:"design_event",createdAt:item.createdAt,label:item.action})),
  ...designs.flatMap(design=>design.versions.slice(-3).map(version=>({id:version.id,type:"version",createdAt:version.createdAt,label:`${design.name}: ${version.label}`}))),
 ].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,50);
 return{
  resolved,designs,snapshots,events,
  aiStatus:{online:echoBrainDesignAdapter.available,lastAnalysis:null,lastProposal:designs.flatMap(item=>item.proposals).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]?.createdAt??null,lastImprovement:designs.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt??null,pendingTasks:designs.filter(item=>item.status==="awaiting_approval").length,runningAgents:0,lastSynchronization:new Date().toISOString(),healthScore:echoBrainDesignAdapter.available?100:45},
 };
}
