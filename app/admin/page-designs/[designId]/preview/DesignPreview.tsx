"use client";

import { useEffect, useState } from "react";
import { Bell, Heart, Home, Menu, UserRound } from "lucide-react";
import { useLanguage } from "../../../../components/LanguageProvider";
import type { DesignVersion, PageDesign, PageDesignFile } from "../../../../../lib/page-designs/types";

type Mode = "desktop" | "tablet" | "mobile";
function fingerprint(files: PageDesignFile[]) {
  return files.reduce((sum, file) => sum + file.content.length, 0);
}
function PreviewCanvas({ files, source, title }: { files: PageDesignFile[]; source: string; title: string }) {
  const signature = fingerprint(files);
  return <article className="pageDesignPreviewCanvas" data-signature={signature}>
    <header><strong>{title}</strong><small>{source} · {files.length} files · snapshot {signature}</small></header>
    <div className="pageDesignPreviewAnnouncement">Announcement area</div>
    <nav aria-label="Toolbar preview"><Menu/><UserRound/><Home/><Heart/><Bell/></nav>
    <main><section className="pageDesignPreviewHero">Page layout and header</section><div className="pageDesignPreviewCards">{[1,2,3,4,5,6].map(card=><span key={card}>Card {card}</span>)}</div></main>
    <dialog open={false}>Dialog preview</dialog>
  </article>;
}
export default function DesignPreview({designId}:{designId:string}){
 const{lang}=useLanguage();const[design,setDesign]=useState<PageDesign>();const[mode,setMode]=useState<Mode>("desktop");const[direction,setDirection]=useState<"rtl"|"ltr">(lang==="ar"?"rtl":"ltr");const[version,setVersion]=useState<DesignVersion>();const[scope,setScope]=useState<{type:string;participantId?:string;sectionIds:string[]}>();
 useEffect(()=>{void fetch(`/api/admin/page-designs?id=${encodeURIComponent(designId)}`,{cache:"no-store"}).then(r=>r.json()).then(x=>setDesign(x.design));},[designId]);
 useEffect(()=>{void fetch(`/api/admin/page-designs/network?designId=${encodeURIComponent(designId)}`,{cache:"no-store"}).then(r=>r.json()).then(x=>setScope(x.impact?.scope));},[designId]);
 if(!design)return <p>Loading…</p>;
 const after=version?.configurationSnapshot.files??design.files;
 return <main className="pageDesignPreview" dir={direction}><header><div><h1>{design.name} — Preview</h1>{scope?.type==="participant"&&<p className="participantSandboxBadge">{lang==="ar"?"نسخة خاصة بالمشارك — غير منشورة":"Participant-Specific Sandbox — Not Published"}: <bdi>{scope.participantId}</bdi></p>}</div><div><button aria-pressed={mode==="desktop"} onClick={()=>setMode("desktop")}>Desktop</button><button aria-pressed={mode==="tablet"} onClick={()=>setMode("tablet")}>Tablet</button><button aria-pressed={mode==="mobile"} onClick={()=>setMode("mobile")}>Mobile</button><button aria-pressed={direction==="rtl"} onClick={()=>setDirection("rtl")}>RTL</button><button aria-pressed={direction==="ltr"} onClick={()=>setDirection("ltr")}>LTR</button><select aria-label="Language" value={lang} disabled><option>{lang}</option></select><select aria-label="Version" value={version?.id??""} onChange={e=>setVersion(design.versions.find(v=>v.id===e.target.value))}><option value="">Current</option>{design.versions.map(v=><option key={v.id} value={v.id}>v{v.versionNumber}</option>)}</select></div></header><div className={`pageDesignCompare pageDesignCompare--${mode}`}><PreviewCanvas files={design.baselineFiles} source={design.sourcePage} title="Before"/><PreviewCanvas files={after} source={design.sourcePage} title={`After · ${scope?.sectionIds.join(", ")??"workspace"}`}/></div></main>;
}
