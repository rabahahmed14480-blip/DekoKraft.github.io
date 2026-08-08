import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { CurrentUserSession } from "../auth/sessionTypes.ts";
import { getKnowledgeContextForEchoBrain } from "./retrieval.ts";
import { semanticKnowledgeAdapter } from "./semanticAdapter.ts";
import { KnowledgeService } from "./service.ts";
import type { KnowledgeEntry, KnowledgeScope, KnowledgeSourceReference } from "./types.ts";

const admin:CurrentUserSession={role:"admin",name:"Reviewer"};
const participantA:CurrentUserSession={role:"participant",participantId:"seller-001",name:"A"};
const participantB:CurrentUserSession={role:"participant",participantId:"seller-002",name:"B"};
const root=()=>fs.mkdtempSync(path.join(os.tmpdir(),"knowledge-"));
const source=(id:string):KnowledgeSourceReference=>({sourceType:"documentation",sourceId:id,capturedAt:new Date().toISOString()});
function draft(service:KnowledgeService,input:{title:string;summary:string;scope?:KnowledgeScope;sourceId?:string;aiGenerated?:boolean;expiresAt?:string;domain?:KnowledgeEntry["domain"]}){
 return service.createDraft(admin,{domain:input.domain??"platform",kind:"fact",title:input.title,summary:input.summary,scope:input.scope??{visibility:"admin_team"},sourceRefs:[source(input.sourceId??input.title)],relatedEntityRefs:[],tags:["test"],aiGenerated:input.aiGenerated,expiresAt:input.expiresAt}).entry;
}

test("ingestion creates a sourced draft and rejects invalid provenance safely",()=>{
 const service=new KnowledgeService(root());
 const result=service.ingestEvent(admin,{id:"event-1",eventType:"publish_result",domain:"design",sourceService:"page-designs",sourceEntityId:"design-1",scope:{visibility:"admin_team",designId:"design-1"},payload:{title:"Published design",summary:"Succeeded",token:"must-not-store"},occurredAt:new Date().toISOString(),actorType:"system",sourceRefs:[source("publish-1")]});
 assert.equal(result.entry.status,"draft");assert.equal(result.entry.content?.includes("must-not-store"),false);
 assert.throws(()=>service.ingestEvent(admin,{id:"bad",eventType:"bad",domain:"service",sourceService:"test",scope:{visibility:"admin_team"},payload:{},occurredAt:new Date().toISOString(),actorType:"system",sourceRefs:[]}),/KNOWLEDGE_PROVENANCE_REQUIRED/);
});

test("participant and admin scopes are enforced by search and reads",()=>{
 const service=new KnowledgeService(root());
 service.createDraft(participantA,{domain:"participant",kind:"fact",title:"Preference A",summary:"RTL",scope:{visibility:"individual_participant",participantId:"seller-001"},sourceRefs:[source("request-a")],relatedEntityRefs:[],tags:["preference"]});
 draft(service,{title:"Admin architecture",summary:"Internal"});
 assert.equal(service.search(participantA,{includeDeprecated:true}).total,1);
 assert.equal(service.search(participantB,{includeDeprecated:true}).total,0);
 assert.equal(service.search(participantB,{query:"Preference A"}).total,0);
});

test("AI knowledge stays draft until an authorized human verifies it",()=>{
 const service=new KnowledgeService(root());const entry=draft(service,{title:"AI proposal",summary:"Advisory",aiGenerated:true,domain:"ai"});
 assert.equal(entry.confidence,"low");
 assert.throws(()=>service.verifyEntry(participantA,entry.id),/KNOWLEDGE_PERMISSION_DENIED/);
 const verified=service.verifyEntry(admin,entry.id,"Human reviewed",[entry.sourceRefs[0].sourceId]);
 assert.equal(verified.status,"verified");assert.equal(verified.verifiedBy,"Reviewer");
});

test("duplicates are detected and superseding preserves the prior record",()=>{
 const service=new KnowledgeService(root());const first=draft(service,{title:"Routing rule",summary:"Version one",sourceId:"routing-doc"});
 const duplicate=service.createDraft(admin,{domain:"platform",kind:"fact",title:"Routing rule",summary:"Version one",scope:{visibility:"admin_team"},sourceRefs:[source("routing-doc")],relatedEntityRefs:[],tags:["test"]});
 assert.equal(duplicate.duplicate,true);
 const replacement=draft(service,{title:"Routing rule",summary:"Version two",sourceId:"routing-doc"});
 assert.equal(service.getEntry(admin,first.id).status,"superseded");
 assert.equal(service.getEntry(admin,first.id).supersededById,replacement.id);
});

test("conflicts remain visible and lower confidence",()=>{
 const service=new KnowledgeService(root());const left=draft(service,{title:"RTL support",summary:"Supported",sourceId:"component-doc"});const right=draft(service,{title:"RTL support",summary:"Failed",sourceId:"rtl-test"});
 service.verifyEntry(admin,left.id);service.verifyEntry(admin,right.id);
 assert.equal(service.detectConflicts(admin).length,1);
 assert.equal(service.getEntry(admin,left.id).confidence,"medium");
 assert.equal(service.getEntry(admin,right.id).confidence,"medium");
});

test("freshness, default recommendation filtering, and domain retrieval are enforced",()=>{
 const service=new KnowledgeService(root());const stale=draft(service,{title:"Old guidance",summary:"Old",expiresAt:"2020-01-01T00:00:00.000Z"});service.verifyEntry(admin,stale.id);
 const deprecated=draft(service,{title:"Bad recommendation",summary:"Do not use",domain:"marketing"});service.verifyEntry(admin,deprecated.id);service.transition(admin,deprecated.id,"deprecated");
 const current=draft(service,{title:"Current design fact",summary:"Use shared components",domain:"design"});service.verifyEntry(admin,current.id);
 assert.equal(service.getEntry(admin,stale.id).freshness,"stale");
 assert.equal(service.search(admin,{query:"Bad recommendation"}).total,0);
 const context=service.getContextForScope(admin,{scope:{visibility:"admin_team"},allowedDomains:["design"],maximumEntries:10,freshnessRequirement:"current"});
 assert.deepEqual(context.map(item=>item.id),[current.id]);assert.ok(context[0].sourceRefs.length);
});

test("EchoBrain context includes verification metadata and bounded graphs do not recurse",()=>{
 const project=root();const service=new KnowledgeService(project);const entries=[0,1,2].map(index=>draft(service,{title:`Entry ${index}`,summary:"Verified"}));for(const entry of entries)service.verifyEntry(admin,entry.id);
 service.addRelationship(admin,{sourceEntryId:entries[0].id,targetEntryId:entries[1].id,relation:"similar_to"});service.addRelationship(admin,{sourceEntryId:entries[0].id,targetEntryId:entries[2].id,relation:"depends_on"});
 assert.equal(service.getRelatedEntries(admin,entries[0].id,1).length,1);
 assert.throws(()=>service.addRelationship(admin,{sourceEntryId:entries[0].id,targetEntryId:entries[0].id,relation:"similar_to"}),/SELF_CYCLE/);
 const context=getKnowledgeContextForEchoBrain(admin,{requestId:"request-1",actorId:"admin",actorPermissions:["knowledge.view"],scope:{visibility:"admin_team"},targetEntityRefs:[],allowedDomains:["platform"],maximumEntries:2,freshnessRequirement:"current"},project);
 assert.equal(context.entries.length,2);assert.equal(context.entries.every(item=>item.verificationState==="verified"&&item.sourceRefs.length>0),true);assert.equal(context.draftsExcluded,true);
});

test("semantic backend absence and evidence-based health are reported honestly",()=>{
 const service=new KnowledgeService(root());const health=service.calculateHealth(admin);
 assert.equal(semanticKnowledgeAdapter.available,false);assert.equal(health.score,0);assert.equal(health.total,0);
});
