import type { CurrentUserSession } from "../auth/sessionTypes";
import type { SmartServicePermission } from "./types.ts";

const participantPermissions: SmartServicePermission[] = [
  "smart_services.view","smart_services.use_ai","smart_services.edit",
  "smart_services.manage_interfaces","smart_services.view_analytics",
];
export function smartServicePermissions(session:CurrentUserSession){
 return new Set<SmartServicePermission>(session.role==="admin"?participantPermissions:participantPermissions);
}
export function assertSmartServicePermission(session:CurrentUserSession,permission:SmartServicePermission){
 if(!smartServicePermissions(session).has(permission))throw new Error("SMART_SERVICE_PERMISSION_DENIED");
}
export function assertParticipantServiceScope(session:CurrentUserSession,targetParticipantId?:string){
 if(session.role==="participant"&&targetParticipantId!==session.participantId)throw new Error("SMART_SERVICE_PARTICIPANT_SCOPE_DENIED");
}
