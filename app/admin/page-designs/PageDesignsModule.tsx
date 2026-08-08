"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Archive, Copy, Eye, FolderOpen, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../components/LanguageProvider";
import HomepageSurface from "../../components/home-v2/HomepageSurface";
import type { PageDesign, PageDesignPermission, PageDesignSource } from "../../../lib/page-designs/types";

const slots = [1, 2, 3, 4, 5] as const;
const words = {
  ar: { title:"تصاميم الصفحة", fresh:"تصميم جديد", saved:"التصاميم المحفوظة", design:"تصميم", open:"فتح", preview:"معاينة", duplicate:"نسخ", rename:"إعادة تسمية", archive:"أرشفة", source:"الصفحة المصدر", status:"الحالة", version:"أحدث إصدار", modified:"آخر تعديل", ai:"الذكاء الاصطناعي", tests:"الاختبارات", progress:"التقدم", available:"متاحة", unavailable:"غير متاحة", admin:"لوحة المدير", participant:"لوحة المشارك", snapshot:"حالة اللقطات الأسبوعية", manual:"إنشاء لقطة يدوية", scheduler:"المجدول الخلفي غير متاح — اللقطات اليدوية تعمل", empty:"لا توجد تصاميم محفوظة." },
  en: { title:"Page Designs", fresh:"New Designs", saved:"Saved Designs", design:"Design", open:"Open", preview:"Preview", duplicate:"Duplicate", rename:"Rename", archive:"Archive", source:"Source page", status:"Status", version:"Latest version", modified:"Last modified", ai:"AI state", tests:"Test state", progress:"Progress", available:"Available", unavailable:"Unavailable", admin:"Admin Dashboard", participant:"Participant Dashboard", snapshot:"Weekly snapshot status", manual:"Create manual snapshot", scheduler:"Backend scheduler unavailable — manual snapshots work", empty:"No saved designs yet." },
} as const;
type Result = { designs?: PageDesign[]; permissions?: PageDesignPermission[]; snapshotStatus?: {lastSuccessful:string|null; nextScheduled:string; status:string; pages:string[]}; error?:string };

export default function PageDesignsModule() {
  const { lang } = useLanguage(); const t = lang === "ar" ? words.ar : words.en;
  const [designs,setDesigns]=useState<PageDesign[]>([]); const [permissions,setPermissions]=useState<PageDesignPermission[]>([]);
  const [snapshot,setSnapshot]=useState<Result["snapshotStatus"]>(); const [message,setMessage]=useState("");
  const [sources,setSources]=useState<Record<number,PageDesignSource>>({1:"participant",2:"admin",3:"participant",4:"admin",5:"participant"});
  const refresh=useCallback(async()=>{const response=await fetch("/api/admin/page-designs",{cache:"no-store"});const result=await response.json() as Result;if(!response.ok)throw new Error(result.error);setDesigns(result.designs??[]);setPermissions(result.permissions??[]);setSnapshot(result.snapshotStatus);},[]);
  useEffect(()=>{void refresh().catch((e:unknown)=>setMessage(e instanceof Error?e.message:"load-failed"));},[refresh]);
  const allowed=(p:PageDesignPermission)=>permissions.includes(p);
  async function command(body:Record<string,unknown>){const response=await fetch("/api/admin/page-designs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const result=await response.json() as Result;if(!response.ok)throw new Error(result.error);await refresh();return result;}
  async function create(slot:number){const result=await command({action:"create",name:`${t.design} ${slot}`,sourcePage:sources[slot]}) as Result&{design?:PageDesign};if(result.design)location.href=`/admin/page-designs/${result.design.id}`;}
  async function rename(design:PageDesign){const name=prompt(t.rename,design.name);if(name?.trim())await command({action:"rename",id:design.id,name});}
  const progress=(d:PageDesign)=>d.status==="published"?100:d.status==="approved"?90:d.status==="awaiting_approval"?75:d.tests.some(x=>x.state==="passed")?60:d.proposals.length?40:20;
  return <div className="pageDesignsModule" dir={lang==="ar"?"rtl":"ltr"}>
    <header className="pageDesignsModuleHeader"><h1>{t.title}</h1><Link href="/admin/page-designs/smart-services">{lang==="ar"?"الخدمات الذكية":"Smart Services"}</Link></header>
    <section className="pageDesignsSection"><h2>{t.fresh}</h2><div className="pageDesignsNewGrid">{slots.map(slot=><HomepageSurface as="article" className="pageDesignCard" interactive key={slot}>
      <ShieldCheck aria-hidden/><h3>{t.design} {slot}</h3><select aria-label={t.source} value={sources[slot]} onChange={e=>setSources(s=>({...s,[slot]:e.target.value as PageDesignSource}))}><option value="participant">{t.participant}</option><option value="admin">{t.admin}</option></select>
      <button disabled={!allowed("page_designs.create")} onClick={()=>void create(slot)}><FolderOpen aria-hidden/>{t.open}</button>
    </HomepageSurface>)}</div></section>
    <section className="pageDesignsSection"><h2>{t.saved}</h2>{message&&<p role="alert">{message}</p>}{!designs.length&&<p>{t.empty}</p>}<div className="pageDesignsSavedList">{designs.map(d=><HomepageSurface as="article" className="pageDesignSavedCard pageDesignRichCard" key={d.id}>
      <div><h3>{d.name}</h3><dl><div><dt>{t.source}</dt><dd>{d.sourcePage==="admin"?t.admin:t.participant}</dd></div><div><dt>{t.status}</dt><dd>{d.status}</dd></div><div><dt>{t.version}</dt><dd>v{d.versions.at(-1)?.versionNumber??1}</dd></div><div><dt>{t.modified}</dt><dd>{new Date(d.updatedAt).toLocaleString(lang)}</dd></div><div><dt>{t.ai}</dt><dd>{d.aiState}</dd></div><div><dt>{t.tests}</dt><dd>{d.tests.some(x=>x.state==="failed")?"failed":d.tests.every(x=>!x.required||x.state==="passed")?"passed":"not_run"}</dd></div><div><dt>{t.progress}</dt><dd><progress value={progress(d)} max="100"/>{progress(d)}%</dd></div><div><dt>{t.preview}</dt><dd>{d.files.length?t.available:t.unavailable}</dd></div></dl></div>
      <div className="pageDesignActions"><Link href={`/admin/page-designs/${d.id}`}><FolderOpen aria-hidden/>{t.open}</Link><Link href={`/admin/page-designs/${d.id}/preview`}><Eye aria-hidden/>{t.preview}</Link><button disabled={!allowed("page_designs.create")} onClick={()=>void command({action:"copy",id:d.id})}><Copy aria-hidden/>{t.duplicate}</button><button disabled={!allowed("page_designs.edit")} onClick={()=>void rename(d)}>{t.rename}</button><button disabled={!allowed("page_designs.archive")} onClick={()=>void command({action:"archive",id:d.id})}><Archive aria-hidden/>{t.archive}</button></div>
    </HomepageSurface>)}</div></section>
    <section className="pageDesignsSection pageDesignSnapshot"><h2>{t.snapshot}</h2><p>{t.scheduler}</p><dl><div><dt>Last</dt><dd>{snapshot?.lastSuccessful?new Date(snapshot.lastSuccessful).toLocaleString(lang):"—"}</dd></div><div><dt>Next expected</dt><dd>{snapshot?.nextScheduled?new Date(snapshot.nextScheduled).toLocaleString(lang):"—"}</dd></div><div><dt>Pages</dt><dd>{snapshot?.pages.join(", ")}</dd></div></dl><button disabled={!allowed("page_designs.manage_snapshots")} onClick={()=>void command({action:"manual_snapshot"})}>{t.manual}</button></section>
  </div>;
}
