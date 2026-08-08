import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isKnownParticipant } from "../participants/registry.ts";
import { resolvePageConfiguration } from "./resolver.ts";
import type {
  DesignNetworkEdge, DesignScope, DesignWorkspaceOverride,
  NetworkAuditEntry, PageSectionId, PartialDesignNetwork,
  ParticipantGroup, SectionConfiguration,
} from "./networkTypes.ts";
import type { PageDesign } from "./types";

const target = (root: string) => path.join(root, ".dekokraft", "partial-design-network.json");
const cache = new Map<string, ReturnType<typeof resolvePageConfiguration>>();
const now = () => new Date().toISOString();
function initial(): PartialDesignNetwork {
  const timestamp=now();
  return {version:1,productionVersion:1,nodes:[
    {id:"platform-root",type:"platform_root",name:"Platform Root",status:"active",createdAt:timestamp,updatedAt:timestamp},
    {id:"admin-page",type:"admin_page",name:"Admin Page",parentId:"platform-root",status:"active",createdAt:timestamp,updatedAt:timestamp},
    {id:"participant-page",type:"participant_page",name:"Participant Root",parentId:"platform-root",status:"active",createdAt:timestamp,updatedAt:timestamp},
  ],edges:[
    edge("platform-root","admin-page","inherits_from",timestamp),
    edge("platform-root","participant-page","inherits_from",timestamp),
  ],groups:[],participantOverrides:[],workspaces:[],audit:[]};
}
function edge(sourceNodeId:string,targetNodeId:string,relation:DesignNetworkEdge["relation"],timestamp=now()):DesignNetworkEdge{
 return{id:randomUUID(),sourceNodeId,targetNodeId,relation,enabled:true,createdAt:timestamp,updatedAt:timestamp};
}
function read(root=process.cwd()):PartialDesignNetwork{
 try{const value=JSON.parse(fs.readFileSync(target(root),"utf8")) as PartialDesignNetwork;return value.version===1?value:initial();}catch{return initial();}
}
function write(value:PartialDesignNetwork,root=process.cwd()){
 const file=target(root);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const temp=`${file}.${process.pid}.tmp`;fs.writeFileSync(temp,`${JSON.stringify(value,null,2)}\n`,{mode:0o600});fs.renameSync(temp,file);
}
function audit(network:PartialDesignNetwork,input:Omit<NetworkAuditEntry,"id"|"createdAt">){
 network.audit.unshift({id:randomUUID(),createdAt:now(),...input});network.audit=network.audit.slice(0,1000);
}
function participantNode(network:PartialDesignNetwork,participantId:string){
 let node=network.nodes.find(item=>item.type==="participant"&&item.metadata?.participantId===participantId);
 if(!node){const timestamp=now();node={id:`participant:${participantId}`,type:"participant",name:participantId,parentId:"participant-page",status:"active",createdAt:timestamp,updatedAt:timestamp,metadata:{participantId}};network.nodes.push(node);network.edges.push(edge("participant-page",node.id,"inherits_from",timestamp));}
 return node;
}
function assertNoCycle(network:PartialDesignNetwork,source:string,targetId:string){
 const parents=new Map(network.nodes.map(node=>[node.id,node.parentId]));let cursor:string|undefined=source;
 while(cursor){if(cursor===targetId)throw new Error("CIRCULAR_INHERITANCE");cursor=parents.get(cursor);}
 const sourceNode=network.nodes.find(node=>node.id===source);const targetNode=network.nodes.find(node=>node.id===targetId);
 if(sourceNode?.type==="participant"&&targetNode?.type==="participant")throw new Error("PARTICIPANT_CANNOT_INHERIT_PARTICIPANT");
}
export function connectNetworkNodes(input:{sourceNodeId:string;targetNodeId:string;relation:DesignNetworkEdge["relation"]},root=process.cwd()){
 const network=read(root);assertNoCycle(network,input.sourceNodeId,input.targetNodeId);network.edges.push(edge(input.sourceNodeId,input.targetNodeId,input.relation));write(network,root);
}
export function listNetworkBranch(input:{participantId?:string;designId?:string},root=process.cwd()){
 const network=read(root);const ids=new Set(["platform-root","participant-page","admin-page"]);
 if(input.participantId){const participantId=input.participantId;participantNode(network,participantId);ids.add(`participant:${participantId}`);for(const group of network.groups.filter(g=>g.memberIds.includes(participantId))){ids.add(`group:${group.id}`);}}
 if(input.designId){ids.add(`design:${input.designId}`);const design=network.nodes.find(node=>node.id===`design:${input.designId}`);for(const snapshot of network.nodes.filter(node=>node.type==="snapshot"&&node.metadata?.sourcePage===design?.metadata?.sourcePage).slice(0,10))ids.add(snapshot.id);}
 write(network,root);
 return {nodes:network.nodes.filter(node=>ids.has(node.id)),edges:network.edges.filter(item=>ids.has(item.sourceNodeId)&&ids.has(item.targetNodeId)),audit:network.audit.filter(item=>(!input.participantId||item.participantId===input.participantId)&&(!input.designId||item.designId===input.designId)).slice(0,50)};
}
export function syncPageDesignNetwork(designs:PageDesign[],root=process.cwd()){
 const network=read(root);const timestamp=now();
 for(const design of designs){
  const type=design.status==="snapshot"?"snapshot":design.status==="saved"||design.status==="archived"?"saved_design":"design_workspace";
  const id=type==="design_workspace"?`design:${design.id}`:`${type}:${design.id}`;
  if(!network.nodes.some(node=>node.id===id)){
   const parentId=design.sourcePage==="admin"?"admin-page":"participant-page";
   network.nodes.push({id,type,name:design.name,parentId,sourceVersionId:design.versions.at(-1)?.id,status:design.status==="archived"?"archived":design.status==="approved"?"approved":design.status==="published"?"published":"draft",createdAt:timestamp,updatedAt:design.updatedAt,metadata:{designId:design.id,sourcePage:design.sourcePage}});
   network.edges.push(edge(parentId,id,design.status==="snapshot"?"backed_up_by":"designed_in",timestamp));
  }
 }
 write(network,root);
}
export function listParticipantGroups(root=process.cwd()){
 return read(root).groups.map(group=>({id:group.id,name:group.name,kind:group.kind,memberCount:group.memberIds.length,version:group.version}));
}
export function setWorkspaceScope(designId:string,scope:DesignScope,actor:string,root=process.cwd()){
 const network=read(root);if(scope.type==="participant"&&(!scope.participantId||!isKnownParticipant(scope.participantId)))throw new Error("PARTICIPANT_NOT_FOUND");
 if(scope.type==="participant_group"&&!network.groups.some(group=>group.id===scope.groupId))throw new Error("GROUP_NOT_FOUND");
 const current=network.workspaces.find(item=>item.designId===designId);
 const value:DesignWorkspaceOverride={designId,scope:{...scope,impactConfirmed:false},baseVersionId:`production-v${network.productionVersion}`,sections:current?.sections??{},updatedAt:now()};
 network.workspaces=network.workspaces.filter(item=>item.designId!==designId);network.workspaces.push(value);
 if(!network.nodes.some(node=>node.id===`design:${designId}`)){const timestamp=now();network.nodes.push({id:`design:${designId}`,type:"design_workspace",name:designId,parentId:scope.participantId?participantNode(network,scope.participantId).id:scope.type==="admin_page"?"admin-page":"participant-page",status:"draft",createdAt:timestamp,updatedAt:timestamp});network.edges.push(edge(network.nodes.at(-1)!.parentId!,`design:${designId}`,"designed_in",timestamp));}
 audit(network,{action:"scope_selected",designId,participantId:scope.participantId,groupId:scope.groupId,inheritedVersion:value.baseVersionId,changedSections:scope.sectionIds,actor,impactCount:calculateImpact(scope,network)});
 cache.clear();write(network,root);return value;
}
export function saveWorkspaceSections(designId:string,sections:Partial<SectionConfiguration>,actor:string,root=process.cwd()){
 const network=read(root);const workspace=network.workspaces.find(item=>item.designId===designId);if(!workspace)throw new Error("DESIGN_SCOPE_REQUIRED");
 const allowed=new Set(workspace.scope.sectionIds);for(const key of Object.keys(sections) as PageSectionId[]){if(!allowed.has(key))throw new Error("SECTION_OUTSIDE_SCOPE");}
 workspace.sections=structuredClone(sections);workspace.updatedAt=now();workspace.scope.impactConfirmed=false;
 audit(network,{action:"sandbox_changed",designId,participantId:workspace.scope.participantId,groupId:workspace.scope.groupId,inheritedVersion:workspace.baseVersionId,changedSections:Object.keys(sections) as PageSectionId[],actor,impactCount:calculateImpact(workspace.scope,network)});
 cache.clear();write(network,root);return workspace;
}
export function confirmWorkspaceImpact(designId:string,root=process.cwd()){const network=read(root);const workspace=network.workspaces.find(item=>item.designId===designId);if(!workspace)throw new Error("DESIGN_SCOPE_REQUIRED");workspace.scope.impactConfirmed=true;write(network,root);return workspace;}
function calculateImpact(scope:DesignScope,network:PartialDesignNetwork){
 if(scope.type==="participant")return 1;if(scope.type==="participant_group")return network.groups.find(group=>group.id===scope.groupId)?.memberIds.length??0;if(scope.type==="admin_page")return 1;return -1;
}
export function workspaceImpact(designId:string,root=process.cwd()){const network=read(root);const workspace=network.workspaces.find(item=>item.designId===designId);return workspace?{count:calculateImpact(workspace.scope,network),scope:workspace.scope}:null;}
export function resolveNetworkConfiguration(input:{pageType:"admin"|"participant";participantId?:string;designId?:string;previewOverrides?:Partial<SectionConfiguration>},root=process.cwd()){
 const network=read(root);const participantId=input.participantId;const groups=participantId?network.groups.filter(group=>group.memberIds.includes(participantId)):[];const participantOverride=participantId?network.participantOverrides.find(item=>item.participantId===participantId&&item.enabled):undefined;const workspaceOverride=input.designId?network.workspaces.find(item=>item.designId===input.designId):undefined;
 const key=`${input.pageType}:${input.participantId??""}:${input.designId??""}:${network.productionVersion}:${groups.map(g=>g.version).join(",")}:${participantOverride?.version??0}:${workspaceOverride?.updatedAt??""}`;
 if(!input.previewOverrides&&cache.has(key))return structuredClone(cache.get(key)!);
 const resolved=resolvePageConfiguration({pageType:input.pageType,participantId:input.participantId,groups,participantOverride,workspaceOverride,previewOverrides:input.previewOverrides,productionVersion:network.productionVersion});if(!input.previewOverrides)cache.set(key,resolved);return resolved;
}
export function publishParticipantWorkspace(designId:string,actor:string,root=process.cwd()){
 const network=read(root);const workspace=network.workspaces.find(item=>item.designId===designId);if(!workspace||workspace.scope.type!=="participant"||!workspace.scope.participantId)throw new Error("PARTICIPANT_SCOPE_REQUIRED");
 const id=workspace.scope.participantId;if(!isKnownParticipant(id))throw new Error("PARTICIPANT_NOT_FOUND");if(!workspace.scope.impactConfirmed||calculateImpact(workspace.scope,network)!==1)throw new Error("IMPACT_CONFIRMATION_REQUIRED");if(workspace.baseVersionId!==`production-v${network.productionVersion}`)throw new Error("BASE_VERSION_CONFLICT");
 let override=network.participantOverrides.find(item=>item.participantId===id);const timestamp=now();
 if(!override){override={id:randomUUID(),participantId:id,sourcePage:"participant",baseVersionId:workspace.baseVersionId,designId,enabled:true,sections:{},version:0,history:[],createdAt:timestamp,updatedAt:timestamp,createdBy:actor};network.participantOverrides.push(override);}
 override.history.push({id:randomUUID(),version:override.version,sections:structuredClone(override.sections),createdAt:timestamp,createdBy:actor,trigger:"publish"});override.sections=structuredClone(workspace.sections);override.version+=1;override.enabled=true;override.updatedAt=timestamp;override.designId=designId;
 participantNode(network,id);audit(network,{action:"participant_published",designId,participantId:id,inheritedVersion:workspace.baseVersionId,changedSections:Object.keys(workspace.sections) as PageSectionId[],actor,impactCount:1});cache.clear();write(network,root);return override;
}
export function rollbackParticipant(participantId:string,mode:"previous"|"global",actor:string,root=process.cwd()){
 const network=read(root);const override=network.participantOverrides.find(item=>item.participantId===participantId);if(!override)throw new Error("PARTICIPANT_OVERRIDE_NOT_FOUND");const timestamp=now();
 if(mode==="global"){override.history.push({id:randomUUID(),version:override.version,sections:structuredClone(override.sections),createdAt:timestamp,createdBy:actor,trigger:"return_global"});override.enabled=false;override.sections={};}
 else{const prior=override.history.at(-1);if(!prior)throw new Error("PREVIOUS_OVERRIDE_NOT_FOUND");override.sections=structuredClone(prior.sections);override.enabled=true;override.history.push({id:randomUUID(),version:override.version,sections:structuredClone(override.sections),createdAt:timestamp,createdBy:actor,trigger:"rollback"});}
 override.version+=1;override.updatedAt=timestamp;audit(network,{action:mode==="global"?"returned_to_global":"participant_rollback",participantId,changedSections:Object.keys(override.sections) as PageSectionId[],actor,impactCount:1});cache.clear();write(network,root);return override;
}
export function upsertGroup(input:{id?:string;name:string;kind:ParticipantGroup["kind"];priority:number;memberIds:string[];sections:Partial<SectionConfiguration>},root=process.cwd()){
 const network=read(root);for(const id of input.memberIds)if(!isKnownParticipant(id))throw new Error("PARTICIPANT_NOT_FOUND");const timestamp=now();const current=network.groups.find(group=>group.id===input.id);const group:ParticipantGroup=current?{...current,...input,id:current.id,version:current.version+1,updatedAt:timestamp}:{...input,id:input.id??randomUUID(),version:1,createdAt:timestamp,updatedAt:timestamp};network.groups=network.groups.filter(item=>item.id!==group.id);network.groups.push(group);
 if(!network.nodes.some(node=>node.id===`group:${group.id}`)){network.nodes.push({id:`group:${group.id}`,type:"participant_group",name:group.name,parentId:"participant-page",status:"active",createdAt:timestamp,updatedAt:timestamp});network.edges.push(edge("participant-page",`group:${group.id}`,"inherits_from",timestamp));}
 cache.clear();write(network,root);return group;
}
export function networkIndexes(root=process.cwd()){const n=read(root);return{participantId:new Map(n.participantOverrides.map((x,i)=>[x.participantId,i])),groupId:new Map(n.groups.map((x,i)=>[x.id,i])),designId:new Map(n.workspaces.map((x,i)=>[x.designId,i])),parentId:new Map(n.nodes.map((x,i)=>[x.parentId??"",i])),sourceVersionId:new Map(n.nodes.map((x,i)=>[x.sourceVersionId??"",i])),status:new Map(n.nodes.map((x,i)=>[x.status,i])),updatedAt:[...n.nodes].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))};}
export function getDesignNetworkHealth(root=process.cwd()){
 const network=read(root);const ids=new Set(network.nodes.map(node=>node.id));
 const brokenLinks=network.edges.filter(edge=>!ids.has(edge.sourceNodeId)||!ids.has(edge.targetNodeId));
 const orphanNodes=network.nodes.filter(node=>node.id!=="platform-root"&&(!node.parentId||!ids.has(node.parentId)));
 let circularDependencies=0;
 for(const node of network.nodes){const seen=new Set<string>();let cursor:typeof node|undefined=node;while(cursor?.parentId){if(seen.has(cursor.parentId)){circularDependencies++;break;}seen.add(cursor.parentId);cursor=network.nodes.find(item=>item.id===cursor?.parentId);}}
 const inheritanceConflicts=network.groups.filter(group=>network.groups.some(other=>other.id!==group.id&&other.kind===group.kind&&other.priority===group.priority&&other.memberIds.some(id=>group.memberIds.includes(id)))).length;
 const unresolvedConfiguration=network.workspaces.filter(workspace=>!workspace.scope.sectionIds.length||(workspace.scope.type==="participant"&&!workspace.scope.participantId)).length;
 return{mainNetwork:{status:brokenLinks.length||orphanNodes.length?"degraded":"healthy",nodes:network.nodes.filter(node=>["platform_root","admin_page","participant_page","component"].includes(node.type)).length},partialNetwork:{status:circularDependencies||inheritanceConflicts||unresolvedConfiguration?"degraded":"healthy",nodes:network.nodes.filter(node=>["participant_group","participant","design_workspace"].includes(node.type)).length},brokenLinks:brokenLinks.length,orphanNodes:orphanNodes.length,circularDependencies,inheritanceConflicts,unresolvedConfiguration,activeGroups:network.groups.length,isolatedOverrides:network.participantOverrides.filter(item=>item.enabled).length,workspaces:network.workspaces.length,audit:network.audit.slice(0,50)};
}
