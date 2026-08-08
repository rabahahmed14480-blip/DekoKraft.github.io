import type{SpeechDocument,SpeechEvent,SynthesizedSpeech}from"./types.ts";import type{SpeechProvider}from"./provider.ts";import{SpeechProviderRegistry,speechProviderRegistry}from"./provider.ts";
export type SpeechLog=(event:SpeechEvent&{provider?:string;language?:string;duration?:number;error?:string})=>void;
const safeLog:SpeechLog=event=>console.info("[speech]",{type:event.type,documentId:event.documentId,occurredAt:event.occurredAt,provider:event.provider,language:event.language,duration:event.duration,error:event.error});
export class SpeechAdapter{
 private controller?:AbortController;private registry:SpeechProviderRegistry;private log:SpeechLog;
 constructor(registry:SpeechProviderRegistry=speechProviderRegistry,log:SpeechLog=safeLog){this.registry=registry;this.log=log;}
 activeProvider():SpeechProvider|undefined{return this.registry.active();}
 async synthesize(document:SpeechDocument){const provider=this.registry.active();if(!provider)throw new Error("SPEECH_PROVIDER_NOT_CONFIGURED");if(!provider.available)throw new Error("SPEECH_PROVIDER_UNAVAILABLE");if(!provider.supportedLanguages().includes(document.language))throw new Error("SPEECH_LANGUAGE_UNSUPPORTED");this.controller=new AbortController();try{const result=await provider.synthesize(document,this.controller.signal);this.log({type:"started",documentId:document.id,occurredAt:new Date().toISOString(),metadata:{phase:"synthesized"},provider:provider.id,language:document.language,duration:result.duration});return result;}catch(error){this.log({type:"error",documentId:document.id,occurredAt:new Date().toISOString(),metadata:{phase:"synthesis"},provider:provider.id,language:document.language,error:error instanceof Error?error.message:"speech-error"});throw error;}finally{this.controller=undefined;}}
 interrupt(){this.controller?.abort();this.controller=undefined;}
 logCompleted(document:SpeechDocument,audio:SynthesizedSpeech){this.log({type:"completed",documentId:document.id,occurredAt:new Date().toISOString(),metadata:{},provider:audio.provider,language:document.language,duration:audio.duration});}
}
