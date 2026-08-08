import type { ReadablePageBlock, ReadablePageInput, StructuredPageReading } from "./types.ts";
import type { ContextSnapshot } from "./page-context/types.ts";
const clean=(value:string)=>value
 .replace(/<(script|style|button|nav|menu|svg)\b[^>]*>[\s\S]*?<\/\1>/gi," ")
 .replace(/<([a-z][\w:-]*)\b[^>]*(?:hidden|aria-hidden\s*=\s*["']?true["']?)[^>]*>[\s\S]*?<\/\1>/gi," ")
 .replace(/<[^>]*>/g,"")
 .replace(/\s+/g," ")
 .trim()
 .slice(0,5000);
export class ReadingService{
 read(input:ReadablePageInput,locale:string):StructuredPageReading{if(!input.title.trim())throw new Error("READING_PAGE_TITLE_REQUIRED");const blocks=input.blocks.slice(0,200).map((block,index)=>this.normalize(block,index)).filter((block):block is ReadablePageBlock=>Boolean(block));const wordCount=blocks.reduce((sum,block)=>sum+block.text.split(/\s+/).filter(Boolean).length+(block.items?.join(" ").split(/\s+/).filter(Boolean).length??0),0);return{title:clean(input.title),summary:clean(input.description??blocks.find(block=>block.type==="paragraph")?.text??""),blocks,wordCount,direction:locale==="ar"?"rtl":"ltr"};}
 toMarkdown(reading:StructuredPageReading){return[`# ${reading.title}`,reading.summary,...reading.blocks.map(block=>block.type==="heading"?`${"#".repeat(Math.min(6,Math.max(2,block.level??2)))} ${block.text}`:block.type==="list"?(block.items??[]).map(item=>`- ${item}`).join("\n"):block.type==="link"?`[${block.text}](${block.href})`:block.type==="code"?`\`\`\`${block.language??""}\n${block.text}\n\`\`\``:block.text)].filter(Boolean).join("\n\n");}
 readContext(snapshot:ContextSnapshot):StructuredPageReading{return this.read({title:snapshot.title,description:snapshot.description??snapshot.summary.join(" "),blocks:snapshot.visibleSections.flatMap(section=>[{id:`${section.id}-heading`,type:"heading"as const,text:section.title,level:2},{id:section.id,type:"paragraph"as const,text:section.content??section.summary??""}]).filter(block=>block.text.trim())},snapshot.language);}
 private normalize(block:ReadablePageBlock,index:number):ReadablePageBlock|null{const text=clean(block.text);const items=block.items?.map(clean).filter(Boolean).slice(0,100);if(!text&&!items?.length)return null;return{...block,id:block.id||`block-${index}`,text,items,href:block.href?.startsWith("/")?block.href:undefined};}
}
