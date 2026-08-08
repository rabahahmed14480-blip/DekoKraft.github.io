"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { cmsTabs, type CmsTabId } from "../config/cmsTabs";
import { useLanguage } from "../../components/LanguageProvider";
import DekoKraftPageShell from "../../components/DekoKraftPageShell";
import {
  HomepageLayout,
  HomepageMain,
} from "../../components/home-v2/HomepageArchitecture";
import HomepageSurface from "../../components/home-v2/HomepageSurface";
import PublicPageShell from "../../components/PublicPageShell";
import { DkBrand, DkPageHero } from "../../components/ui";
import { HomepageHeaderFrame } from "../../components/home-v2/HomepageArchitecture";
import { routes } from "../../config/routes";
import "../admin-v2.css";
import "../../participant/participant.css";

import AnnouncementBar from "../../components/AnnouncementBar";
import {
  createAnnouncementPayload,
  type AnnouncementMessages,
  type AnnouncementPayload,
  type AnnouncementSpeed,
} from "../../../lib/announcements/types";
import { getParticipantRegistry } from "../../../lib/participants/registry";
import AdminAnnouncementEditor from "./AdminAnnouncementEditor";
import AdminCleanToolbar from "./AdminCleanToolbar";
import AdminSharedToolbar from "./AdminTopToolbar";
import ParticipantBroadcastModal from "./ParticipantBroadcastModal";
import ParticipantAnnouncementEditorModal, {
  type ParticipantAnnouncementView as ParticipantEditorAnnouncementView,
} from "./ParticipantAnnouncementEditorModal";
import ParticipantAnnouncementTextEditorModal from "./ParticipantAnnouncementTextEditorModal";
import ParticipantSelectForEditModal from "./ParticipantSelectForEditModal";
import AdminFooter from "./layout/AdminFooter";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import AdminToolLauncher from "./AdminToolLauncher";
import ProductModal, {
  type ProductModalSavedProduct,
} from "./products/ProductModal";
import ParticipantAnnouncementBar from "../../participant/components/ParticipantAnnouncementBar";

type AdminAnnouncementResponse = {
  active: AnnouncementPayload | null;
  status: "active" | "stopped";
  updatedAt: string;
};

type ParticipantAnnouncementView = {
  participantId: string;
  participantAnnouncement: AnnouncementPayload | null;
  participant: {
    broadcastRevision: number;
  } | null;
};

const mainAnnouncementDefaults: AnnouncementMessages = {
  ar: "الإعلان الرئيسي في DekoKraft",
  de: "DekoKraft Hauptankündigung",
  en: "DekoKraft main announcement",
  fr: "Annonce principale DekoKraft",
};

const participantAnnouncementDefaults: AnnouncementMessages = {
  ar: "مرحبًا بكم في إعلان المشارك",
  de: "Willkommen bei der Teilnehmeranzeige",
  en: "Welcome to the participant announcement",
  fr: "Bienvenue dans l’annonce du participant",
};

function completeAnnouncementMessages(
  messages: AnnouncementMessages,
  defaults: AnnouncementMessages,
): AnnouncementMessages {
  return {
    ar: messages.ar.trim() || defaults.ar,
    de: messages.de.trim() || defaults.de,
    en: messages.en.trim() || defaults.en,
    fr: messages.fr.trim() || defaults.fr,
  };
}

type AdminShellProps = {
  variant?: "legacy" | "clean";
  cleanContent?: ReactNode;
};

export default function AdminShell({
  variant = "legacy",
  cleanContent,
}: AdminShellProps) {
  const [activeTab, setActiveTab] = useState<CmsTabId>("dashboard");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);
  const [lastSavedProduct, setLastSavedProduct] =
    useState<ProductModalSavedProduct | null>(null);
  const [productSaveSuccessMessage, setProductSaveSuccessMessage] =
    useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMainAnnouncementEditorOpen, setIsMainAnnouncementEditorOpen] =
    useState(false);
  const [isMainAnnouncementVisible, setIsMainAnnouncementVisible] =
    useState(false);
  const [
    isParticipantAnnouncementVisible,
    setIsParticipantAnnouncementVisible,
  ] = useState(false);
  const [
    isParticipantAnnouncementTextEditorOpen,
    setIsParticipantAnnouncementTextEditorOpen,
  ] = useState(false);
  const [participantBroadcastDraft, setParticipantBroadcastDraft] =
    useState<AnnouncementPayload>(() =>
      createAnnouncementPayload({ ...participantAnnouncementDefaults })
    );
  const [
    isParticipantBroadcastModalOpen,
    setIsParticipantBroadcastModalOpen,
  ] =
    useState(false);
  const [isParticipantEditorOpen, setIsParticipantEditorOpen] =
    useState(false);
  const [selectedParticipantIdForEdit, setSelectedParticipantIdForEdit] =
    useState<string | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] =
    useState<AnnouncementPayload | null>(null);
  const [mainAnnouncement, setMainAnnouncement] =
    useState<AnnouncementPayload | null>(() =>
      createAnnouncementPayload(mainAnnouncementDefaults)
    );
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(() => getParticipantRegistry()[0]?.participantId ?? null);
  const [participantAnnouncementView, setParticipantAnnouncementView] =
    useState<ParticipantAnnouncementView | null>(null);
  const [participantPreviewRevision, setParticipantPreviewRevision] =
    useState(0);
  const [participantPreviewLoadRevision, setParticipantPreviewLoadRevision] =
    useState(0);
  const [mainAnimationRevision, setMainAnimationRevision] = useState(0);
  const [mainAnnouncementSpeed, setMainAnnouncementSpeed] =
    useState<AnnouncementSpeed>("normal");
  const [participantBroadcastSpeed, setParticipantBroadcastSpeed] =
    useState<AnnouncementSpeed>("normal");
  const { lang, setLang, t } = useLanguage();

  const isArabic = lang === "ar";
  const direction = isArabic ? "rtl" : "ltr";
  const active = cmsTabs.find((tab) => tab.id === activeTab);
  const broadcastParticipants = getParticipantRegistry().map((participant) => ({
    id: participant.participantId,
    name: participant.storeName ?? participant.name,
  }));
  const selectedParticipant = broadcastParticipants.find(
    (participant) => participant.id === selectedParticipantId,
  );

  const openAddProductForm = () => {
    setActiveTab("products");
    setProductSaveSuccessMessage("");
    setIsProductModalOpen(true);
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const refreshMainAnnouncement = async () => {
      try {
        const mainResponse = await fetch("/api/admin/main-announcement", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (mainResponse.ok) {
          const main =
            await mainResponse.json() as AdminAnnouncementResponse;
          if (active) {
            setMainAnnouncement(main.active);
            setMainAnnouncementSpeed(main.active?.speed ?? "normal");
          }
        }
      } catch {
        // Keep the last server-backed view if a background refresh is interrupted.
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshMainAnnouncement();
      }
    };

    void refreshMainAnnouncement();
    window.addEventListener("focus", refreshMainAnnouncement);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("focus", refreshMainAnnouncement);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!selectedParticipantId) {
      setParticipantAnnouncementView(null);
      return;
    }
    const controller = new AbortController();
    void fetch(
      `/api/participant/announcement/?participantId=${encodeURIComponent(selectedParticipantId)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("participant-announcement-load-failed");
        return response.json() as Promise<ParticipantAnnouncementView>;
      })
      .then(setParticipantAnnouncementView)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setParticipantAnnouncementView(null);
        }
      });
    return () => controller.abort();
  }, [participantPreviewLoadRevision, selectedParticipantId]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isSidebarOpen]);

  const handleMainAnnouncementButton = () => {
    if (!isMainAnnouncementVisible) {
      setPreviewAnnouncement(mainAnnouncement);
      setIsMainAnnouncementEditorOpen(true);
      return;
    }
    setIsMainAnnouncementVisible(false);
  };

  const handleParticipantAnnouncementButton = () => {
    if (isParticipantAnnouncementVisible) {
      setIsParticipantAnnouncementVisible(false);
      return;
    }
    setIsParticipantAnnouncementTextEditorOpen(true);
  };

  const editorAnnouncement =
    previewAnnouncement ??
    mainAnnouncement ??
    createAnnouncementPayload(mainAnnouncementDefaults);

  async function saveMainAnnouncement(payload: AnnouncementPayload) {
    const response = await fetch("/api/admin/main-announcement", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        target: "main",
        operation: "save",
        payload,
      }),
    });
    if (!response.ok) {
      throw new Error("main-announcement-save-failed");
    }
    const result = await response.json() as AdminAnnouncementResponse;
    setMainAnnouncement(result.active);
    setMainAnnouncementSpeed(result.active?.speed ?? payload.speed ?? "normal");
  }

  async function restoreMainAnnouncement() {
    const response = await fetch("/api/admin/main-announcement", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        target: "main",
        operation: "restore",
      }),
    });
    if (!response.ok) {
      throw new Error("main-announcement-restore-failed");
    }
    const result = await response.json() as AdminAnnouncementResponse;
    setMainAnnouncement(result.active);
    setMainAnnouncementSpeed(result.active?.speed ?? "normal");
    setPreviewAnnouncement(null);
    return result.active ?? createAnnouncementPayload(mainAnnouncementDefaults);
  }

  const participantAnnouncementDialogs = (
    <>
      {isParticipantAnnouncementTextEditorOpen && (
        <ParticipantAnnouncementTextEditorModal
          lang={lang}
          draft={participantBroadcastDraft}
          onCancel={() => {
            setIsParticipantAnnouncementTextEditorOpen(false);
          }}
          onPreview={(draft) => {
            setParticipantBroadcastDraft(draft);
            setParticipantBroadcastSpeed(draft.speed ?? "normal");
          }}
          onContinue={(draft) => {
            const broadcastDraft = {
              ...draft,
              speed: draft.speed ?? participantBroadcastSpeed,
            };
            setParticipantBroadcastDraft(broadcastDraft);
            setParticipantBroadcastSpeed(
              broadcastDraft.speed ?? "normal",
            );
            setIsParticipantAnnouncementTextEditorOpen(false);
            setIsParticipantBroadcastModalOpen(true);
          }}
        />
      )}
      <ParticipantBroadcastModal
        isOpen={isParticipantBroadcastModalOpen}
        lang={lang}
        participants={broadcastParticipants}
        announcement={participantBroadcastDraft}
        onClose={() => setIsParticipantBroadcastModalOpen(false)}
        onBack={() => {
          setIsParticipantBroadcastModalOpen(false);
          setIsParticipantAnnouncementTextEditorOpen(true);
        }}
        onBroadcastComplete={(participantIds) => {
          setSelectedParticipantId(
            participantIds[0] ?? selectedParticipantId,
          );
          setIsParticipantAnnouncementVisible(true);
          setParticipantPreviewRevision((value) => value + 1);
          setParticipantPreviewLoadRevision((value) => value + 1);
          setIsParticipantBroadcastModalOpen(false);
        }}
      />
    </>
  );

  if (variant === "clean") {
    return (
      <PublicPageShell
        className="admin-clean-page-frame"
        chrome={(
          <div className="publicSiteChrome">
            {isMainAnnouncementVisible && (
              <AnnouncementBar
                lang={lang}
                announcement={mainAnnouncement}
                animationRevision={mainAnimationRevision}
                direction={direction}
                speed={mainAnnouncementSpeed}
              />
            )}
            {isParticipantAnnouncementVisible &&
              selectedParticipant &&
              participantAnnouncementView?.participantAnnouncement && (
                <ParticipantAnnouncementBar
                  lang={lang}
                  participantId={selectedParticipant.id}
                  participantName={selectedParticipant.name}
                  announcement={
                    participantAnnouncementView.participantAnnouncement
                  }
                  enabled
                  broadcastRevision={
                    participantAnnouncementView.participant
                      ?.broadcastRevision ?? 0
                  }
                  animationRevision={participantPreviewRevision}
                  speed={
                    participantAnnouncementView.participantAnnouncement.speed ??
                    "normal"
                  }
                />
              )}
            <HomepageHeaderFrame dir={direction}>
              <AdminCleanToolbar
                lang={lang}
                setLang={setLang}
                isMenuOpen={isSidebarOpen}
                isAnnouncementActive={isMainAnnouncementVisible}
                isParticipantAnnouncementActive={
                  isParticipantAnnouncementVisible
                }
                onToggleMenu={() => setIsSidebarOpen((open) => !open)}
                onToggleAnnouncement={handleMainAnnouncementButton}
                onToggleParticipantAnnouncement={
                  handleParticipantAnnouncementButton
                }
              />
              {isSidebarOpen && (
                <nav
                  id="dk-admin-clean-navigation"
                  className="publicQuickMenu"
                  role="menu"
                  dir={direction}
                  aria-label={t("admin.dashboard.pageTitle")}
                >
                  {cmsTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsSidebarOpen(false);
                      }}
                    >
                      {t(`admin.sidebar.${tab.id}`)}
                    </button>
                  ))}
                </nav>
              )}
            </HomepageHeaderFrame>
          </div>
        )}
      >
        <HomepageLayout>
          <HomepageMain
            className="participant-page admin-clean-page"
            dir={direction}
            data-dir={direction}
          >
            <HomepageSurface className="participant-empty-content-surface admin-empty-content-surface">
              {cleanContent ?? null}
            </HomepageSurface>
          </HomepageMain>
        </HomepageLayout>
        {isMainAnnouncementEditorOpen && (
          <AdminAnnouncementEditor
            isOpen={isMainAnnouncementEditorOpen}
            key="main"
            title={t("toolbar.mainAnnouncement")}
            lang={lang}
            initialValues={editorAnnouncement.messages}
            initialFormatting={editorAnnouncement.formatting}
            initialLanguage={editorAnnouncement.language ?? lang}
            initialBannerThickness={
              editorAnnouncement.bannerThickness ??
              editorAnnouncement.bannerHeight
            }
            initialBannerLength={
              editorAnnouncement.bannerLength ??
              editorAnnouncement.bannerWidth
            }
            initialTextColor={editorAnnouncement.textColor}
            initialBackgroundColor={editorAnnouncement.backgroundColor}
            initialImageReference={editorAnnouncement.imageReference}
            initialLogoSize={editorAnnouncement.logoSize ?? 48}
            initialSpeed={mainAnnouncementSpeed}
            revision="main"
            currentLogoUrl={editorAnnouncement.logoReference ?? undefined}
            onCancel={() => {
              setPreviewAnnouncement(null);
              setMainAnnouncementSpeed(mainAnnouncement?.speed ?? "normal");
              setIsMainAnnouncementEditorOpen(false);
            }}
            onPreview={(payload: AnnouncementPayload) => {
              setMainAnnouncementSpeed(payload.speed ?? "normal");
              setPreviewAnnouncement({
                ...payload,
                messages: completeAnnouncementMessages(
                  payload.messages,
                  mainAnnouncementDefaults,
                ),
              });
            }}
            onSave={async (payload: AnnouncementPayload) => {
              const savedPayload = {
                ...payload,
                speed: payload.speed ?? mainAnnouncementSpeed,
                messages: completeAnnouncementMessages(
                  payload.messages,
                  mainAnnouncementDefaults,
                ),
              };
              await saveMainAnnouncement(savedPayload);
              setPreviewAnnouncement(null);
              setIsMainAnnouncementVisible(true);
              setIsMainAnnouncementEditorOpen(false);
              setMainAnimationRevision((value) => value + 1);
            }}
            onRestoreDefault={async () => {
              const restored = await restoreMainAnnouncement();
              setIsMainAnnouncementEditorOpen(false);
              return restored;
            }}
          />
        )}
        {participantAnnouncementDialogs}
      </PublicPageShell>
    );
  }

  return (
    <DekoKraftPageShell
      className="adminPublicPageFrame"
      bodyClassName="adminPublicPageBody"
      chrome={(
        <div className="publicSiteChrome">
          {isMainAnnouncementVisible && (
            <AnnouncementBar
              lang={lang}
              announcement={mainAnnouncement}
              animationRevision={mainAnimationRevision}
              direction={direction}
              speed={mainAnnouncementSpeed}
            />
          )}
          {isParticipantAnnouncementVisible &&
            selectedParticipant &&
            participantAnnouncementView?.participantAnnouncement && (
              <ParticipantAnnouncementBar
                lang={lang}
                participantId={selectedParticipant.id}
                participantName={selectedParticipant.name}
                announcement={
                  participantAnnouncementView.participantAnnouncement
                }
                enabled
                broadcastRevision={
                  participantAnnouncementView.participant
                    ?.broadcastRevision ?? 0
                }
                animationRevision={participantPreviewRevision}
                speed={
                  participantAnnouncementView.participantAnnouncement.speed ??
                  "normal"
                }
              />
            )}
          <header className="publicHeader" dir={direction}>
            <div className="publicHeaderMain publicContentContainer">
              <AdminSharedToolbar
                lang={lang}
                setLang={setLang}
                isMenuOpen={isSidebarOpen}
                onEditMainAnnouncement={handleMainAnnouncementButton}
                onOpenParticipantBroadcast={
                  handleParticipantAnnouncementButton
                }
                isParticipantAnnouncementActive={
                  isParticipantAnnouncementVisible
                }
                isMainAnnouncementActive={isMainAnnouncementVisible}
                onToggleMenu={() => {
                  setIsSidebarOpen((open) => !open);
                }}
              />
            </div>
            {isSidebarOpen && (
              <nav
                id="dk-admin-navigation"
                className="publicQuickMenu"
                role="menu"
                dir={direction}
                aria-label={t("admin.dashboard.pageTitle")}
              >
                {cmsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false);
                    }}
                  >
                    {t(`admin.sidebar.${tab.id}`)}
                  </button>
                ))}
                <Link role="menuitem" href={routes.admin.aiCost} onClick={() => setIsSidebarOpen(false)}>
                  {t("dashboardCards.aiCost")}
                </Link>
                <Link role="menuitem" href={routes.admin.financial} onClick={() => setIsSidebarOpen(false)}>
                  {t("dashboardCards.financial")}
                </Link>
              </nav>
            )}
          </header>
        </div>
      )}
    >
      <HomepageLayout>
        <HomepageMain className="adminSharedPage" dir={direction}>
          {activeTab === "dashboard" && (
            <DkPageHero
              className="homeHero participant-homepage-hero publicContentContainer"
              title={(
                <span className="dekokraftBrand">
                  <DkBrand
                    className="dk-brand-heading"
                    name={t("header.brand")}
                    subtitle={t("header.tagline")}
                    mediaSrc="/videos/logo/logo.mp4"
                    mediaType="video"
                    mediaAlt="DekoKraft animated logo"
                    fallbackImageSrc="/logo-dekokraft-600.webp"
                  />
                  <span>{t("admin.dashboard.pageTitle")}</span>
                </span>
              )}
              description={t("admin.dashboard.pageSubtitle")}
              size="large"
            />
          )}
          <HomepageSurface className="adminSharedContentSurface">
            <div className="adminSharedContent">
          {activeTab === "dekobrain" && <AdminToolLauncher lang={lang} />}

          {activeTab === "dashboard" && (
            <DashboardPage
              lang={lang}
            />
          )}

          {activeTab === "products" && (
            <ProductsPage
              lang={lang}
              onAddProduct={openAddProductForm}
              refreshKey={productsRefreshKey}
              savedProduct={lastSavedProduct}
              saveSuccessMessage={productSaveSuccessMessage}
            />
          )}

          {activeTab !== "dashboard" && activeTab !== "products" && activeTab !== "dekobrain" && (
            <section className="dkHeroCard">
              <h2>
                {active?.icon} {t(`admin.sidebar.${activeTab}`)}
              </h2>

              <p>{t("admin.readySection")}</p>
            </section>
          )}
            </div>
          </HomepageSurface>
          <AdminFooter lang={lang} version={t("admin.version")} rights={t("admin.rights")} />
        </HomepageMain>
      </HomepageLayout>

        <ProductModal
          open={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSaved={(product, successMessage) => {
            setLastSavedProduct(product);
            setProductSaveSuccessMessage(successMessage);
            setProductsRefreshKey((current) => current + 1);
          }}
          lang={lang}
        />
        {isMainAnnouncementEditorOpen && (
          <AdminAnnouncementEditor
            isOpen={isMainAnnouncementEditorOpen}
            key="main"
            title={t("toolbar.mainAnnouncement")}
            lang={lang}
            initialValues={editorAnnouncement.messages}
            initialFormatting={editorAnnouncement.formatting}
            initialLanguage={editorAnnouncement.language ?? lang}
            initialBannerThickness={
              editorAnnouncement.bannerThickness ??
              editorAnnouncement.bannerHeight
            }
            initialBannerLength={
              editorAnnouncement.bannerLength ??
              editorAnnouncement.bannerWidth
            }
            initialTextColor={editorAnnouncement.textColor}
            initialBackgroundColor={editorAnnouncement.backgroundColor}
            initialImageReference={editorAnnouncement.imageReference}
            initialLogoSize={editorAnnouncement.logoSize ?? 48}
            initialSpeed={mainAnnouncementSpeed}
            revision="main"
            currentLogoUrl={editorAnnouncement.logoReference ?? undefined}
            onCancel={() => {
              setPreviewAnnouncement(null);
              setMainAnnouncementSpeed(mainAnnouncement?.speed ?? "normal");
              setIsMainAnnouncementEditorOpen(false);
            }}
            onPreview={(payload: AnnouncementPayload) => {
              setMainAnnouncementSpeed(payload.speed ?? "normal");
              setPreviewAnnouncement({
                ...payload,
                messages: completeAnnouncementMessages(
                  payload.messages,
                  mainAnnouncementDefaults,
                ),
              });
            }}
            onSave={async (payload: AnnouncementPayload) => {
              const savedPayload = {
                ...payload,
                speed: payload.speed ?? mainAnnouncementSpeed,
                messages: completeAnnouncementMessages(
                  payload.messages,
                  mainAnnouncementDefaults,
                ),
              };

              await saveMainAnnouncement(savedPayload);
              setPreviewAnnouncement(null);
              setIsMainAnnouncementVisible(true);
              setIsMainAnnouncementEditorOpen(false);
              setMainAnimationRevision((value) => value + 1);
            }}
            onRestoreDefault={async () => {
              const restored = await restoreMainAnnouncement();
              setIsMainAnnouncementEditorOpen(false);
              return restored;
            }}
          />
        )}
        {isParticipantEditorOpen && !selectedParticipantIdForEdit && (
          <ParticipantSelectForEditModal
            lang={lang}
            participants={broadcastParticipants}
            onSelect={(participantId) => {
              setSelectedParticipantIdForEdit(participantId);
            }}
            onClose={() => {
              setSelectedParticipantIdForEdit(null);
              setIsParticipantEditorOpen(false);
            }}
          />
        )}
        {isParticipantEditorOpen && selectedParticipantIdForEdit && (
          <ParticipantAnnouncementEditorModal
            participantId={selectedParticipantIdForEdit}
            lang={lang}
            onBack={() => setSelectedParticipantIdForEdit(null)}
            onClose={() => {
              setSelectedParticipantIdForEdit(null);
              setIsParticipantEditorOpen(false);
            }}
            onSaved={(view: ParticipantEditorAnnouncementView) => {
              setSelectedParticipantId(view.participantId);
              setParticipantAnnouncementView(view);
              setParticipantPreviewRevision((value) => value + 1);
              window.dispatchEvent(
                new CustomEvent("participant-announcement-change", {
                  detail: view,
                }),
              );
            }}
          />
        )}
        {participantAnnouncementDialogs}
    </DekoKraftPageShell>
  );
}
