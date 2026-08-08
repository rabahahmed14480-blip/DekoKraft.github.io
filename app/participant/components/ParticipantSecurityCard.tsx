"use client";

import { useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import HomepageSurface from "../../components/home-v2/HomepageSurface";

type CleanPreview = {
  previewId: string;
  estimatedBytes: number;
  candidates: Array<{ id: string; title: string; sizeBytes: number }>;
};

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "تعذر تنفيذ العملية.");
  return data;
}

export default function ParticipantSecurityCard() {
  const [busy, setBusy] = useState<"" | "cleanup" | "scan">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function cleanup() {
    setBusy("cleanup"); setError(""); setMessage("");
    try {
      const { preview } = await post<{ preview: CleanPreview }>("/api/participant/security/cleanup", { action: "preview" });
      const list = preview.candidates.length ? preview.candidates.map((item) => `• ${item.title}`).join("\n") : "لا توجد عناصر مؤقتة قابلة للتنظيف.";
      if (!preview.candidates.length) { setMessage(list); return; }
      if (!window.confirm(`سيُنظّف النظام الملفات المؤقتة الخاصة بحسابك فقط:\n${list}\n\nالحجم التقريبي: ${preview.estimatedBytes} بايت\n\nتنظيف الآن؟`)) return;
      const result = await post<{ reclaimedBytes: number; operation: { summary: string } }>("/api/participant/security/cleanup", { action: "execute", previewId: preview.previewId, candidateIds: preview.candidates.map((item) => item.id), confirmed: true });
      setMessage(`${result.operation.summary} المساحة المحررة: ${result.reclaimedBytes} بايت.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر التنظيف."); }
    finally { setBusy(""); }
  }

  async function scan() {
    setBusy("scan"); setError(""); setMessage("تهيئة الفحص");
    try {
      const { run } = await post<{ run: { scanId: string; phase: string } }>("/api/participant/security/scan", {});
      setMessage(`${run.phase} — الفحص مقيد بموارد حسابك فقط.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تشغيل الفحص."); }
    finally { setBusy(""); }
  }

  return (
    <HomepageSurface
      as="section"
      className="participantSecurityCard"
      aria-labelledby="participant-security-title"
    >
      <header><ShieldCheck aria-hidden="true" /><div><h3 id="participant-security-title">الأمان</h3><p>فحص وتنظيف آمنان داخل مساحة حسابك فقط.</p></div></header>
      <div>
        <button type="button" onClick={() => void cleanup()} disabled={Boolean(busy)}><Sparkles aria-hidden="true" />التنظيف</button>
        <button type="button" onClick={() => void scan()} disabled={Boolean(busy)}><ShieldCheck aria-hidden="true" />الفحص</button>
      </div>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </HomepageSurface>
  );
}
