import { requireAdminSession, participantAccessResponse } from "../../../../../lib/auth/participantAccess";
import { getParticipantRegistry } from "../../../../../lib/participants/registry";
import { requirePageDesignPermission } from "../../../../../lib/page-designs/permissions";
import { getPageDesign, listPageDesigns } from "../../../../../lib/page-designs/store";
import {
  confirmWorkspaceImpact, listNetworkBranch, publishParticipantWorkspace,
  resolveNetworkConfiguration, rollbackParticipant, saveWorkspaceSections,
  setWorkspaceScope, upsertGroup, workspaceImpact, listParticipantGroups,
  syncPageDesignNetwork,
} from "../../../../../lib/page-designs/networkStore";
import type {
  DesignScope, ParticipantGroup, SectionConfiguration,
} from "../../../../../lib/page-designs/networkTypes";

const actor = (session:{name?:string}) => session.name || "Admin";
export async function GET(request:Request){
 try{
  const session=await requireAdminSession();requirePageDesignPermission(session,"page_designs.view");
  const query=new URL(request.url).searchParams;const designId=query.get("designId")??undefined;const participantId=query.get("participantId")??undefined;
  if(query.get("mode")==="participants"){const search=(query.get("search")??"").trim().toLowerCase();const page=Math.max(1,Number(query.get("page"))||1);const size=Math.min(25,Math.max(1,Number(query.get("pageSize"))||10));const matches=getParticipantRegistry().filter(item=>!search||item.participantId.toLowerCase().includes(search));return Response.json({participants:matches.slice((page-1)*size,page*size).map(item=>({participantId:item.participantId})),page,pageSize:size,total:matches.length});}
  const pageType=query.get("pageType")==="admin"?"admin":"participant";
  syncPageDesignNetwork(listPageDesigns());
  return Response.json({branch:listNetworkBranch({participantId,designId}),groups:listParticipantGroups(),resolved:resolveNetworkConfiguration({pageType,participantId,designId}),impact:designId?workspaceImpact(designId):null});
 }catch(error){return participantAccessResponse(error);}
}
export async function POST(request:Request){
 try{
  const session=await requireAdminSession();const body=await request.json() as Record<string,unknown>;const by=actor(session);
  if(body.action==="set_scope"){requirePageDesignPermission(session,"page_designs.edit");return Response.json({workspace:setWorkspaceScope(String(body.designId??""),body.scope as DesignScope,by)});}
  if(body.action==="save_sections"){requirePageDesignPermission(session,"page_designs.edit");return Response.json({workspace:saveWorkspaceSections(String(body.designId??""),body.sections as Partial<SectionConfiguration>,by)});}
  if(body.action==="confirm_impact"){requirePageDesignPermission(session,"page_designs.review");return Response.json({workspace:confirmWorkspaceImpact(String(body.designId??""))});}
  if(body.action==="publish_participant"){requirePageDesignPermission(session,"page_designs.publish");const design=getPageDesign(String(body.designId??""));if(design.status!=="approved"||design.tests.some(test=>test.required&&test.state!=="passed"))return Response.json({error:"DESIGN_APPROVAL_REQUIRED"},{status:400});return Response.json({override:publishParticipantWorkspace(design.id,by)});}
  if(body.action==="rollback_participant"){requirePageDesignPermission(session,"page_designs.rollback");return Response.json({override:rollbackParticipant(String(body.participantId??""),body.mode==="global"?"global":"previous",by)});}
  if(body.action==="upsert_group"){requirePageDesignPermission(session,"page_designs.edit");return Response.json({group:upsertGroup(body.group as {id?:string;name:string;kind:ParticipantGroup["kind"];priority:number;memberIds:string[];sections:Partial<SectionConfiguration>})});}
  return Response.json({error:"invalid-network-action"},{status:400});
 }catch(error){const message=error instanceof Error?error.message:"network-failed";if(message.includes("PARTICIPANT")||message.includes("SCOPE")||message.includes("SECTION")||message.includes("IMPACT")||message.includes("VERSION")||message.includes("GROUP")||message.includes("CIRCULAR"))return Response.json({error:message},{status:400});return participantAccessResponse(error);}
}
