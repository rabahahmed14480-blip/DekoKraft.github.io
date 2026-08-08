import { participantAccessResponse, requireAuthenticatedUser } from "../../../lib/auth/participantAccess";
import { backfillOperationalKnowledge, registeredKnowledgeDomains } from "../../../lib/knowledge/domainAdapters";
import { getKnowledgeContextForEchoBrain } from "../../../lib/knowledge/retrieval";
import { assertKnowledgePermission, knowledgePermissions } from "../../../lib/knowledge/security";
import { KnowledgeService } from "../../../lib/knowledge/service";
import { semanticKnowledgeAdapter } from "../../../lib/knowledge/semanticAdapter";
import type { KnowledgeContextRequest } from "../../../lib/knowledge/retrieval";
import type { KnowledgeEntry, KnowledgeEvent, KnowledgeSearchFilters } from "../../../lib/knowledge/types";

export async function GET(request:Request){
 try{const session=await requireAuthenticatedUser();const query=new URL(request.url).searchParams;const service=new KnowledgeService();const mode=query.get("mode")??"search";
  if(mode==="entry"){const id=query.get("id");if(!id)return Response.json({error:"id-required"},{status:400});return Response.json({entry:service.getEntry(session,id),related:service.getRelatedEntries(session,id,Number(query.get("limit"))||20)});}
  if(mode==="health")return Response.json({health:service.calculateHealth(session),domains:registeredKnowledgeDomains,semanticBackendAvailable:semanticKnowledgeAdapter.available});
  if(mode==="conflicts")return Response.json({conflicts:service.detectConflicts(session)});
  const filters:KnowledgeSearchFilters={query:query.get("q")??undefined,domain:query.get("domain") as KnowledgeSearchFilters["domain"]||undefined,kind:query.get("kind") as KnowledgeSearchFilters["kind"]||undefined,status:query.get("status") as KnowledgeSearchFilters["status"]||undefined,confidence:query.get("confidence") as KnowledgeSearchFilters["confidence"]||undefined,participantId:query.get("participantId")??undefined,designId:query.get("designId")??undefined,serviceId:query.get("serviceId")??undefined,tag:query.get("tag")??undefined,page:Number(query.get("page"))||1,pageSize:Number(query.get("pageSize"))||20,includeDeprecated:query.get("includeDeprecated")==="true"};
  return Response.json({result:service.search(session,filters),permissions:[...knowledgePermissions(session)],domains:registeredKnowledgeDomains,semanticBackendAvailable:semanticKnowledgeAdapter.available});
 }catch(error){return knowledgeError(error);}
}
export async function POST(request:Request){
 try{const session=await requireAuthenticatedUser();const body=await request.json()as Record<string,unknown>;const service=new KnowledgeService();
  if(body.action==="backfill"){assertKnowledgePermission(session,"knowledge.manage_ingestion");return Response.json({backfill:backfillOperationalKnowledge(session)});}
  if(body.action==="ingest")return Response.json({result:service.ingestEvent(session,body.event as KnowledgeEvent)});
  if(body.action==="create_draft")return Response.json({result:service.createDraft(session,body.entry as Omit<KnowledgeEntry,"id"|"status"|"confidence"|"createdAt"|"updatedAt"|"createdBy"|"fingerprint"|"reviews">)});
  if(body.action==="verify")return Response.json({entry:service.verifyEntry(session,String(body.id??""),String(body.notes??""),Array.isArray(body.evidence)?body.evidence.map(String):[])});
  if(body.action==="deprecate"||body.action==="archive")return Response.json({entry:service.transition(session,String(body.id??""),body.action==="archive"?"archived":"deprecated",String(body.notes??""))});
  if(body.action==="supersede")return Response.json({entry:service.supersedeEntry(session,String(body.id??""),String(body.replacementId??""),String(body.notes??""))});
  if(body.action==="add_relationship")return Response.json({relationship:service.addRelationship(session,body.relationship as Parameters<KnowledgeService["addRelationship"]>[1])});
  if(body.action==="rebuild_index")return Response.json({index:service.rebuildIndex(session)});
  if(body.action==="context")return Response.json({context:getKnowledgeContextForEchoBrain(session,body.request as KnowledgeContextRequest)});
  return Response.json({error:"invalid-knowledge-action"},{status:400});
 }catch(error){return knowledgeError(error);}
}
function knowledgeError(error:unknown){const message=error instanceof Error?error.message:"knowledge-failed";if(message.startsWith("KNOWLEDGE_")||message.startsWith("AI_")||message.startsWith("SEMANTIC_"))return Response.json({error:message},{status:message.includes("PERMISSION")||message.includes("SCOPE")?403:400});return participantAccessResponse(error);}
