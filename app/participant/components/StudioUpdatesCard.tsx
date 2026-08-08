"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { CloudUpload, ExternalLink, RefreshCw, X } from "lucide-react";
import HomepageSurface from "../../components/home-v2/HomepageSurface";
import { DkButton } from "../../components/ui";

type Status = {
  configured: boolean;
  status: "unavailable" | "queued" | "in_progress" | "success" | "failure";
  startedAt?: string;
  completedAt?: string;
  version?: string;
};

const labels: Record<Status["status"], string> = {
  unavailable: "غير متاح",
  queued: "في قائمة الانتظار",
  in_progress: "جاري البناء والنشر",
  success: "تم نشر التحديث",
  failure: "فشل التحديث",
};

export default function StudioUpdatesCard({ viewerRole }: { viewerRole: "participant" | "admin" }) {
  const dialogTitleId = useId();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const statusUrl = viewerRole === "admin" ? "/api/admin/studio-deployment" : "/api/participant/studio-update/status";

  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(statusUrl, { cache: "no-store" });
      const body = await response.json() as Status & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "تعذر تحميل حالة النشر.");
      setStatus(body);
    } finally {
      setBusy(false);
    }
  }, [statusUrl]);

  useEffect(() => {
    void refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل حالة النشر."));
  }, [refresh]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  async function deploy() {
    if (!window.confirm("هل تريد بدء بناء ونشر الإصدار الحالي من الاستوديو؟")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/studio-deployment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const body = await response.json() as Status & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "تعذر بدء النشر.");
      setStatus(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر بدء النشر.");
    } finally {
      setBusy(false);
    }
  }

  const refreshStatus = () => {
    void refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل الحالة."));
  };

  return (
    <>
      <HomepageSurface as="article" className="dk-dashboard-grid__card participantStudioUpdatesCard" interactive>
        <DkButton
          onClick={() => setIsOpen(true)}
          aria-label="تحديثات الاستوديو"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          icon={<CloudUpload />}
          variant="transparent"
          size="lg"
        >
          <span className="dk-dashboard-grid__content">
            <strong>تحديثات الاستوديو</strong>
            <small>متابعة حالة GitHub وآخر تحديث ونشر الاستوديو.</small>
          </span>
        </DkButton>
      </HomepageSurface>

      {isOpen && (
        <div
          className="participantStudioUpdatesDialogBackdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            className="participantStudioUpdatesDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
          >
            <header>
              <div>
                <CloudUpload aria-hidden="true" />
                <h3 id={dialogTitleId}>تحديثات الاستوديو</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="إغلاق تفاصيل تحديثات الاستوديو">
                <X aria-hidden="true" />
              </button>
            </header>

            <dl className="participantStudioUpdateStatus">
              <div>
                <dt>حالة اتصال GitHub</dt>
                <dd>{status?.configured ? "متصل" : "غير مكتمل"}</dd>
              </div>
              <div>
                <dt>آخر تحديث للاستوديو</dt>
                <dd dir={status?.version ? "ltr" : undefined}>{status?.version ?? "غير متاح"}</dd>
              </div>
              <div>
                <dt>آخر وقت نشر</dt>
                <dd>{status?.completedAt ?? "غير متاح"}</dd>
              </div>
              <div>
                <dt>حالة آخر عملية نشر</dt>
                <dd>{status ? labels[status.status] : "جاري التحقق"}</dd>
              </div>
            </dl>

            {error && <p className="participantStudioUpdatesError" role="alert">{error}</p>}

            <div className="participantStudioUpdatesActions">
              <DkButton href="/studio" aria-label="فتح الاستوديو" icon={<ExternalLink />}>
                فتح الاستوديو
              </DkButton>
              <button type="button" onClick={refreshStatus} disabled={busy}>
                <RefreshCw aria-hidden="true" />
                حالة تحديث الاستوديو
              </button>
              {viewerRole === "admin" && (
                <button type="button" onClick={() => void deploy()} disabled={busy || !status?.configured}>
                  <CloudUpload aria-hidden="true" />
                  نشر تحديث الاستوديو
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
