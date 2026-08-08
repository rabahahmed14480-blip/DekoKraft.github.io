import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  confirmWorkspaceImpact, connectNetworkNodes, listNetworkBranch,
  networkIndexes, publishParticipantWorkspace, resolveNetworkConfiguration,
  rollbackParticipant, saveWorkspaceSections, setWorkspaceScope, upsertGroup,
} from "./networkStore.ts";

const root = () => fs.mkdtempSync(path.join(os.tmpdir(), "partial-network-"));
const actor = "Network Test";
const layout = (columns:number) => ({layout:{enabled:true,settings:{columns}}});

test("participant override is lazy, section-level, and isolated from peers, global, and Admin", () => {
  const project=root();const designId="design-isolation";
  const beforeA=resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001"},project);
  const beforeB=resolveNetworkConfiguration({pageType:"participant",participantId:"seller-002"},project);
  const admin=resolveNetworkConfiguration({pageType:"admin"},project);
  setWorkspaceScope(designId,{type:"participant",participantId:"seller-001",sectionIds:["layout"],impactConfirmed:false},actor,project);
  saveWorkspaceSections(designId,layout(4),actor,project);
  assert.equal(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001"},project).sections.layout.settings?.columns,undefined);
  confirmWorkspaceImpact(designId,project);publishParticipantWorkspace(designId,actor,project);
  assert.equal(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001"},project).sections.layout.settings?.columns,4);
  assert.deepEqual(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-002"},project),beforeB);
  assert.deepEqual(resolveNetworkConfiguration({pageType:"admin"},project),admin);
  assert.equal(beforeA.sections.toolbar.componentVersionId,resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001"},project).sections.toolbar.componentVersionId);
  rollbackParticipant("seller-001","global",actor,project);
  assert.deepEqual(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001"},project).sections,beforeA.sections);
});

test("group inheritance is deterministic and affects members only", () => {
  const project=root();
  upsertGroup({id:"org-a",name:"Org A",kind:"organization",priority:1,memberIds:["seller-001","seller-002"],sections:layout(2)},project);
  upsertGroup({id:"cohort-a",name:"Cohort A",kind:"cohort",priority:1,memberIds:["seller-001"],sections:layout(3)},project);
  assert.equal(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001"},project).sections.layout.settings?.columns,3);
  assert.equal(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-002"},project).sections.layout.settings?.columns,2);
  assert.equal(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-003"},project).sections.layout.settings?.columns,undefined);
  upsertGroup({id:"cohort-a",name:"Cohort A",kind:"cohort",priority:1,memberIds:[],sections:layout(3)},project);
  assert.equal(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001"},project).sections.layout.settings?.columns,2);
});

test("sandbox is isolated, inheritance cycles are rejected, and sparse indexes scale", () => {
  const project=root();const id="design-sandbox";
  setWorkspaceScope(id,{type:"participant",participantId:"seller-001",sectionIds:["colors"],impactConfirmed:false},actor,project);
  saveWorkspaceSections(id,{colors:{enabled:true,settings:{accent:"#123456"}}},actor,project);
  assert.equal(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001"},project).sections.colors.settings?.accent,undefined);
  assert.equal(resolveNetworkConfiguration({pageType:"participant",participantId:"seller-001",designId:id},project).sections.colors.settings?.accent,"#123456");
  listNetworkBranch({participantId:"seller-001"},project);listNetworkBranch({participantId:"seller-002"},project);
  assert.throws(()=>connectNetworkNodes({sourceNodeId:"participant:seller-001",targetNodeId:"participant:seller-002",relation:"inherits_from"},project),/PARTICIPANT_CANNOT_INHERIT_PARTICIPANT|CIRCULAR/);
  const indexes=networkIndexes(project);
  assert.equal(indexes.designId.has(id),true);
  assert.equal(indexes.participantId.size,0);
  const raw=JSON.parse(fs.readFileSync(path.join(project,".dekokraft","partial-design-network.json"),"utf8")) as {participantOverrides:unknown[]};
  assert.equal(raw.participantOverrides.length,0);
});
