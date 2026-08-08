import type{SpeechDocument,SpeechProgress,SynthesizedSpeech}from"./types.ts";import{SpeechAdapter}from"./adapter.ts";
export interface AudioPlaybackBackend{load(audio:SynthesizedSpeech):Promise<void>;play():Promise<void>;pause():Promise<void>;stop():Promise<void>;seek(seconds:number):Promise<void>;currentTime():number;duration():number;setPlaybackRate(rate:number):void;onEnded(listener:()=>void):()=>void;}
export type SpeechPlayerLifecycle=(event:"started"|"paused"|"resumed"|"completed"|"stopped"|"error",document?:SpeechDocument,error?:unknown)=>void;
export class SpeechPlayer{
 private document?:SpeechDocument;private audio?:SynthesizedSpeech;private state:SpeechProgress["state"]="idle";private lifecycle:SpeechPlayerLifecycle=()=>{};private unsubscribe?:()=>void;private adapter:SpeechAdapter;private backend:AudioPlaybackBackend;
 constructor(adapter:SpeechAdapter,backend:AudioPlaybackBackend){this.adapter=adapter;this.backend=backend;this.unsubscribe=this.backend.onEnded(()=>{this.state="completed";if(this.document&&this.audio)this.adapter.logCompleted(this.document,this.audio);this.lifecycle("completed",this.document);});}
 setLifecycleListener(listener:SpeechPlayerLifecycle){this.lifecycle=listener;}
 async play(document:SpeechDocument){if(this.document&&this.state==="playing")await this.stop();this.document=document;this.state="loading";try{this.audio=await this.adapter.synthesize(document);await this.backend.load(this.audio);this.backend.setPlaybackRate(document.speed);await this.backend.play();this.state="playing";this.lifecycle("started",document);}catch(error){this.state="error";this.lifecycle("error",document,error);throw error;}}
 async pause(){if(this.state!=="playing")return;await this.backend.pause();this.state="paused";this.lifecycle("paused",this.document);}
 async resume(){if(this.state!=="paused")return;await this.backend.play();this.state="playing";this.lifecycle("resumed",this.document);}
 async stop(){this.adapter.interrupt();await this.backend.stop();this.state="stopped";this.lifecycle("stopped",this.document);}
 async seek(seconds:number){if(!this.document)return;await this.backend.seek(Math.max(0,Math.min(seconds,this.backend.duration())));}
 async restart(){await this.seek(0);if(this.state!=="playing"){await this.backend.play();this.state="playing";this.lifecycle("resumed",this.document);}}
 progress():SpeechProgress{const duration=this.backend.duration()||this.audio?.duration||this.document?.estimatedDuration||0;const currentTime=Math.min(this.backend.currentTime(),duration);let cumulative=0,currentSegment=0;for(const[index,segment]of(this.document?.segments??[]).entries()){cumulative+=segment.estimatedDuration+segment.pauseBefore+segment.pauseAfter;if(currentTime<=cumulative){currentSegment=index;break;}}return{state:this.state,currentTime,duration,percentage:duration?Math.round(currentTime/duration*100):0,currentSegment,remainingTime:Math.max(0,duration-currentTime),documentId:this.document?.id};}
 dispose(){this.unsubscribe?.();this.unsubscribe=undefined;}
}
