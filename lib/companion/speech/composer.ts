import{randomUUID}from"node:crypto";import type{SpeechDocument,SpeechLanguage,SpeechPriority,SpeechSegment,SpeechTone,VoiceProfile}from"./types.ts";
const voices:Record<SpeechLanguage,VoiceProfile>={
 ar:{id:"ar-professional-natural",language:"ar",style:"professional",speed:1,pitch:1,provider:"unassigned"},
 en:{id:"en-professional-natural",language:"en",style:"professional",speed:1,pitch:1,provider:"unassigned"},
 fr:{id:"fr-professional-natural",language:"fr",style:"professional",speed:1,pitch:1,provider:"unassigned"},
 de:{id:"de-professional-natural",language:"de",style:"professional",speed:1,pitch:1,provider:"unassigned"},
};
const clean=(text:string)=>text.replace(/```[\s\S]*?```/g," Code block omitted. ").replace(/`([^`]+)`/g,"$1").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/[*_~>#]/g,"").replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
function tone(text:string,isHeading:boolean):SpeechTone{const lower=text.toLowerCase();if(/^(hello|hi|welcome|مرحب|أهلًا|bonjour|hallo)/.test(lower))return"greeting";if(/[?؟]\s*$/.test(text))return"question";if(/warning|caution|تحذير|achtung|attention/i.test(text))return"warning";if(/confirmed|saved|success|تم بنجاح|bestätigt|confirmé/i.test(text))return"confirmation";if(/congrat|مبروك|félicit|glückwunsch/i.test(text))return"celebration";if(isHeading)return"professional";if(/because|means|therefore|لأن|يعني|daher|parce que/i.test(text))return"explanation";return"friendly";}
export class SpeechComposer{
 compose(input:{text:string;language:SpeechLanguage;voice?:VoiceProfile;style?:string;speed?:number;priority?:SpeechPriority;source:SpeechDocument["source"]}):SpeechDocument{
  const lines=input.text.replace(/\r/g,"").split(/\n+/).map(line=>line.trim()).filter(Boolean);const segments:SpeechSegment[]=[];
  for(const line of lines){const isHeading=/^#{1,6}\s+/.test(line);const normalized=clean(line);if(!normalized)continue;const sentences=(isHeading?[normalized]:normalized.match(/[^.!?؟؛;:]+[.!?؟؛;:]?/g)??[normalized]).map(clean).filter(Boolean);for(const sentence of sentences){const segmentTone=tone(sentence,isHeading);const words=sentence.split(/\s+/).length;const speed=input.speed??input.voice?.speed??1;const duration=Math.max(.6,(words/155)*60/speed);segments.push({id:randomUUID(),text:sentence,pauseBefore:isHeading?.35:segmentTone==="warning"?.3:0,pauseAfter:segmentTone==="question"?.45:isHeading?.5:/[.!?؟]$/.test(sentence)?.3:.15,tone:segmentTone,importance:segmentTone==="warning"?"high":isHeading?"high":"normal",canInterrupt:input.priority!=="emergency",estimatedDuration:duration});}}
  if(!segments.length)throw new Error("SPEECH_DOCUMENT_EMPTY");const voice={...(input.voice??voices[input.language]),speed:input.speed??input.voice?.speed??1};return{id:randomUUID(),segments,language:input.language,voice,style:input.style??"professional-friendly-calm-natural",speed:voice.speed,priority:input.priority??"normal",estimatedDuration:segments.reduce((sum,segment)=>sum+segment.estimatedDuration+segment.pauseBefore+segment.pauseAfter,0),createdAt:new Date().toISOString(),source:input.source};
 }
}
