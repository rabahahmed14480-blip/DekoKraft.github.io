"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, PanelLeft, PanelRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  BrandIdentityEditorMetadata,
  BrandIdentityEditorResult,
} from "../../admin/studio/components/MiniDesignEditor";
import { routes } from "../../config/routes";
import { getEffectiveSeller } from "../../seller/lib/sellerAccountStorage";
import {
  loadParticipantBrandIdentity,
  saveParticipantBrandIdentity,
  type ParticipantBrandIdentity,
} from "../lib/participantBrandIdentityStorage";

const MiniDesignEditor = dynamic(
  () => import("../../admin/studio/components/MiniDesignEditor"),
  {
    ssr: false,
    loading: () => <p className="studioActionMessage">جارٍ تحميل محرر التصميم...</p>,
  },
);

const LIBRARY_SELECTION_KEY = "dekokraft.studio.librarySelection";

export default function ParticipantBrandStudioPage({
  participantId,
}: {
  participantId: string;
}) {
  const router = useRouter();
  const participant = getEffectiveSeller(participantId);
  const [identity, setIdentity] = useState<ParticipantBrandIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [brandName, setBrandName] = useState(
    participant?.store.storeName ?? participantId,
  );
  const [tagline, setTagline] = useState(
    participant?.store.shortDescription ?? "",
  );
  const [primaryColor, setPrimaryColor] = useState("#315fea");
  const [secondaryColor, setSecondaryColor] = useState("#f0bc50");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [editorImage, setEditorImage] = useState<string>();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    void Promise.resolve()
      .then(() => loadParticipantBrandIdentity(participantId))
      .then((saved) => {
        if (cancelled) return;
        setIdentity(saved);
        if (saved) {
          setBrandName(saved.brandName);
          setTagline(saved.tagline ?? "");
          setPrimaryColor(saved.primaryColor ?? "#315fea");
          setSecondaryColor(saved.secondaryColor ?? "#f0bc50");
          setTextColor(saved.textColor ?? "#ffffff");
          setFontFamily(saved.fontFamily ?? "Arial");
          setEditorImage(saved.logoUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("تعذر تحميل هوية العلامة.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  useEffect(() => {
    const receiveLibrarySelection = () => {
      const selectedImage = window.sessionStorage.getItem(LIBRARY_SELECTION_KEY);
      if (selectedImage) setEditorImage(selectedImage);
    };
    window.addEventListener("focus", receiveLibrarySelection);
    return () => window.removeEventListener("focus", receiveLibrarySelection);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(
      () => setMessage((current) => (current === message ? "" : current)),
      4000,
    );
    return () => window.clearTimeout(timeout);
  }, [message]);

  const metadata: BrandIdentityEditorMetadata = {
    brandName,
    tagline,
    primaryColor,
    secondaryColor,
    textColor,
    fontFamily,
  };

  async function handleSave(result: BrandIdentityEditorResult) {
    setMessage("جارٍ حفظ الهوية...");
    const saved = saveParticipantBrandIdentity(participantId, {
      brandName: result.brandName,
      tagline: result.tagline,
      logoUrl: result.renderedImageUrl,
      coverImageUrl: identity?.coverImageUrl,
      primaryColor: result.primaryColor,
      secondaryColor: result.secondaryColor,
      textColor: result.textColor,
      fontFamily: result.fontFamily,
    });
    setIdentity(saved);
    setLoading(false);
    router.push(routes.participant.root);
    router.refresh();
  }

  return (
    <main
      className="brandStudioPage"
      data-left-panel-open={leftPanelOpen || undefined}
      data-right-panel-open={rightPanelOpen || undefined}
    >
      <header className="brandStudioHeader">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft aria-hidden="true" />
          رجوع
        </button>
        <div>
          <strong>{brandName || "استوديو هوية العلامة"}</strong>
          <small>{participantId}</small>
        </div>
        <div className="brandStudioMobilePanels">
          <button
            type="button"
            aria-pressed={leftPanelOpen}
            onClick={() => setLeftPanelOpen((current) => !current)}
          >
            <PanelLeft aria-hidden="true" />
            الأدوات
          </button>
          <button
            type="button"
            aria-pressed={rightPanelOpen}
            onClick={() => setRightPanelOpen((current) => !current)}
          >
            <PanelRight aria-hidden="true" />
            الخصائص
          </button>
        </div>
      </header>

      <section className="brandStudioWorkspace">
        {loading ? (
          <p className="brandStudioState" role="status">
            جارٍ تحميل هوية العلامة...
          </p>
        ) : loadError ? (
          <div className="brandStudioState" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => window.location.reload()}>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <MiniDesignEditor
            mode="brand-identity"
            participantId={participantId}
            imageSource={editorImage}
            imageName={brandName}
            isOpen
            brandIdentityMetadata={metadata}
            onCancel={() => router.back()}
            onMessage={setMessage}
            onSave={handleSave}
          />
        )}
        {message && (
          <p className="brandStudioMessage" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
