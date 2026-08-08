import { participantAccessResponse, requireAuthenticatedUser } from "../../../lib/auth/participantAccess";
import { isKnownParticipant } from "../../../lib/participants/registry";
import { getPageDesign, listPageDesigns } from "../../../lib/page-designs/store";
import { smartServiceRegistry } from "../../../lib/smart-services/registry";
import { buildSmartServiceKnowledge } from "../../../lib/smart-services/knowledge";
import { analyzeProductDraft } from "../../../lib/smart-services/productForm";
import { createPrivateInterface, listInterfaces, requestInterfaceActivation } from "../../../lib/smart-services/interfaceStore";
import { assertParticipantServiceScope, assertSmartServicePermission, smartServicePermissions } from "../../../lib/smart-services/security";

function target(session:{role:string;participantId?:string},requested:string|null){
 const participantId=requested??session.participantId;
 if(participantId&&!isKnownParticipant(participantId))throw new Error("PARTICIPANT_NOT_FOUND");
 return participantId;
}
export async function GET(request:Request){
 try{
  const session=await requireAuthenticatedUser();assertSmartServicePermission(session,"smart_services.view");const participantId=target(session,new URL(request.url).searchParams.get("participantId"));assertParticipantServiceScope(session,participantId);const knowledge=buildSmartServiceKnowledge({participantId});
  const services=smartServiceRegistry.list().map(service=>({id:service.id,name:service.name,description:service.description,status:service.status({session,participantId,resolvedConfiguration:knowledge.resolved}),permissions:service.permissions,actions:service.actions,history:service.history({session,participantId,resolvedConfiguration:knowledge.resolved}),analytics:service.analytics({session,participantId,resolvedConfiguration:knowledge.resolved}),health:service.health({session,participantId,resolvedConfiguration:knowledge.resolved}),settings:service.settings}));
  return Response.json({services,permissions:[...smartServicePermissions(session)],interfaces:listInterfaces({participantId,designs:knowledge.designs}),aiStatus:knowledge.aiStatus,notifications:knowledge.events,participantId});
 }catch(error){const message=error instanceof Error?error.message:"smart-services-failed";if(message.includes("PARTICIPANT")||message.includes("SMART_SERVICE"))return Response.json({error:message},{status:message.includes("DENIED")?403:400});return participantAccessResponse(error);}
}
export async function POST(request:Request){
 try{
  const session=await requireAuthenticatedUser();const body=await request.json()as Record<string,unknown>;const participantId=target(session,typeof body.participantId==="string"?body.participantId:null);assertParticipantServiceScope(session,participantId);
  if(body.action==="analyze_product"){assertSmartServicePermission(session,"smart_services.edit");return Response.json({analysis:analyzeProductDraft(body.draft&&typeof body.draft==="object"?body.draft as Record<string,unknown>:{})});}
  if(body.action==="request_interface_activation"){assertSmartServicePermission(session,"smart_services.manage_interfaces");return Response.json({interface:requestInterfaceActivation(String(body.interfaceId??""),participantId)});}
  if(body.action==="create_private_interface"){assertSmartServicePermission(session,"smart_services.manage_interfaces");if(!participantId)return Response.json({error:"PARTICIPANT_REQUIRED"},{status:400});const design=getPageDesign(String(body.designId??""));if(design.sourcePage!=="participant")return Response.json({error:"PARTICIPANT_DESIGN_REQUIRED"},{status:400});return Response.json({interface:createPrivateInterface({participantId,design,name:String(body.name??design.name)})});}
  if(body.action==="ask_ai"||body.action==="generate_content"||body.action==="marketing_advice"||body.action==="design_advice"){assertSmartServicePermission(session,"smart_services.use_ai");return Response.json({error:"ECHOBRAIN_SMART_SERVICES_BACKEND_UNAVAILABLE"},{status:503});}
  if(body.action==="request_new_interface"){assertSmartServicePermission(session,"smart_services.manage_interfaces");return Response.json({request:{status:"draft",autoPublishes:false,sourceDesignCount:listPageDesigns().length}});}
  return Response.json({error:"invalid-smart-service-action"},{status:400});
 }catch(error){const message=error instanceof Error?error.message:"smart-services-failed";if(message.includes("INTERFACE")||message.includes("PARTICIPANT")||message.includes("SMART_SERVICE"))return Response.json({error:message},{status:message.includes("DENIED")?403:400});return participantAccessResponse(error);}
}
