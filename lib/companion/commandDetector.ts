import type { DetectedCommand, DetectedCommandType } from "./types.ts";
const patterns:Array<[DetectedCommandType,RegExp]>=[
 ["stop_reading",/^(stop reading|توقف عن القراءة|أوقف القراءة)\.?$/i],
 ["continue_reading",/^(continue|continue reading|تابع|واصل القراءة)\.?$/i],
 ["read_page",/^(read (this )?page|اقرأ (هذه )?الصفحة)\.?$/i],
 ["explain_page",/^(explain (this )?page|اشرح (هذه )?الصفحة)\.?$/i],
 ["open_settings",/^(open settings|افتح الإعدادات)\.?$/i],
 ["help",/^(help( me)?|ساعدني|مساعدة)\.?$/i],
];
export function detectCommand(text:string):DetectedCommand{for(const[type,pattern]of patterns)if(pattern.test(text.trim()))return{type,confidence:1,rawText:text,action:type==="open_settings"?{type:"navigate",target:"settings"}:type.includes("reading")||type==="read_page"?{type:"reading_control",target:type}:undefined};return{type:"none",confidence:0,rawText:text};}
