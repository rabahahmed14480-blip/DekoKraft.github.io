import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { CurrentUserSession } from "../auth/sessionTypes.ts";
import type { PageDesign } from "../page-designs/types.ts";
import { analyzeProductDraft } from "./productForm.ts";
import { createPrivateInterface, listInterfaces, requestInterfaceActivation } from "./interfaceStore.ts";
import { smartServiceRegistry } from "./registry.ts";
import { assertParticipantServiceScope } from "./security.ts";

const design = {
  id:"design-private",name:"Private Interface",sourcePage:"participant",status:"approved",
  versions:[{id:"version-1"}],
} as PageDesign;
const project=()=>fs.mkdtempSync(path.join(os.tmpdir(),"smart-services-"));

test("all modular services expose the consistent non-publishing contract",()=>{
 const services=smartServiceRegistry.list();
 assert.equal(services.length,10);
 assert.equal(new Set(services.map(service=>service.id)).size,10);
 for(const service of services){
  assert.ok(service.permissions.length);
  assert.equal(service.settings.autoPublish,false);
  for(const action of service.actions)assert.equal(action.autoPublishes,false);
 }
});

test("private interfaces are visible only to their owning participant and activation is approval-only",()=>{
 const root=project();
 const owned=createPrivateInterface({participantId:"seller-001",design,name:"Owned"},root);
 assert.equal(listInterfaces({participantId:"seller-001",designs:[]},root).some(item=>item.id===owned.id),true);
 assert.equal(listInterfaces({participantId:"seller-002",designs:[]},root).some(item=>item.id===owned.id),false);
 assert.throws(()=>requestInterfaceActivation(owned.id,"seller-002",root),/INTERFACE_SCOPE_DENIED/);
 const requested=requestInterfaceActivation(owned.id,"seller-001",root);
 assert.equal(requested.activationStatus,"pending_approval");
});

test("participant security and product guidance remain scoped and advisory",()=>{
 const session={role:"participant",participantId:"seller-001",name:"Participant"}as CurrentUserSession;
 assert.doesNotThrow(()=>assertParticipantServiceScope(session,"seller-001"));
 assert.throws(()=>assertParticipantServiceScope(session,"seller-002"),/SMART_SERVICE_PARTICIPANT_SCOPE_DENIED/);
 const result=analyzeProductDraft({title:"Cup",description:"",price:"",images:[]});
 assert.ok(result.missingFields.includes("price"));
 assert.equal(result.advisoryOnly,true);
 assert.ok(result.completenessScore<100);
});
