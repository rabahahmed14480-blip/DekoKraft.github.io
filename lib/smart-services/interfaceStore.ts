import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { PageDesign } from "../page-designs/types";
import type { PageInterface } from "./types.ts";

type Store={version:1;interfaces:PageInterface[]};
const file=(root:string)=>path.join(root,".dekokraft","page-interfaces.json");
function read(root=process.cwd()):Store{try{return JSON.parse(fs.readFileSync(file(root),"utf8"))as Store;}catch{return{version:1,interfaces:[]};}}
function write(store:Store,root=process.cwd()){const target=file(root);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});const temporary=`${target}.${process.pid}.tmp`;fs.writeFileSync(temporary,`${JSON.stringify(store,null,2)}\n`,{mode:0o600});fs.renameSync(temporary,target);}
export function syncDesignInterfaces(designs:PageDesign[],root=process.cwd()){
 const store=read(root);let changed=false;for(const design of designs.filter(item=>item.status!=="snapshot")){
  if(store.interfaces.some(item=>item.sourceDesignId===design.id))continue;const timestamp=new Date().toISOString();store.interfaces.push({id:randomUUID(),name:design.name,category:design.status==="published"?"current":design.status==="approved"?"recommended":"new",sourceDesignId:design.id,versionId:design.versions.at(-1)?.id,previewAvailable:true,activationStatus:design.status==="published"?"active":"inactive",createdAt:timestamp,updatedAt:timestamp});changed=true;
 }if(changed)write(store,root);return store.interfaces;
}
export function listInterfaces(input:{participantId?:string;designs:PageDesign[]},root=process.cwd()){
 syncDesignInterfaces(input.designs,root);return read(root).interfaces.filter(item=>item.category!=="private"||item.ownerParticipantId===input.participantId);
}
export function createPrivateInterface(input:{participantId:string;design:PageDesign;name:string},root=process.cwd()){
 const store=read(root);const timestamp=new Date().toISOString();const value:PageInterface={id:randomUUID(),name:input.name.slice(0,120),category:"private",sourceDesignId:input.design.id,versionId:input.design.versions.at(-1)?.id,ownerParticipantId:input.participantId,previewAvailable:true,activationStatus:"inactive",createdAt:timestamp,updatedAt:timestamp};store.interfaces.push(value);write(store,root);return value;
}
export function requestInterfaceActivation(id:string,participantId:string|undefined,root=process.cwd()){
 const store=read(root);const item=store.interfaces.find(value=>value.id===id);if(!item)throw new Error("INTERFACE_NOT_FOUND");if(item.category==="private"&&item.ownerParticipantId!==participantId)throw new Error("INTERFACE_SCOPE_DENIED");item.activationStatus="pending_approval";item.updatedAt=new Date().toISOString();write(store,root);return item;
}
export function getInterfaceOperations(root=process.cwd()){
 const interfaces=read(root).interfaces;
 return{total:interfaces.length,privateInterfaces:interfaces.filter(item=>item.category==="private").length,pendingActivation:interfaces.filter(item=>item.activationStatus==="pending_approval").length,active:interfaces.filter(item=>item.activationStatus==="active").length};
}
