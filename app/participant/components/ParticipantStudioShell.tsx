"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { BellRing, Home } from "lucide-react";
import AnnouncementEditorModal from "../../components/announcements/AnnouncementEditorModal";
import HomeToolbarIconButton, {
  HomeToolbarIcon,
} from "../../components/home-v2/HomeToolbarIconButton";
import HomepageSurface from "../../components/home-v2/HomepageSurface";
import {
  HomepageHeaderFrame,
  HomepageLayout,
  HomepageMain,
} from "../../components/home-v2/HomepageArchitecture";
import { useLanguage } from "../../components/LanguageProvider";
import PublicPageShell from "../../components/PublicPageShell";
import PublicServiceCenterModal from "../../components/PublicServiceCenterModal";
import {
  DkBrand,
  DkContentSection,
  DkLanguageMenu,
  DkPageHero,
  DkToolbarGroup,
} from "../../components/ui";
import { publicPath } from "../../lib/publicPath";
import { routes } from "../../config/routes";
import {
  getEffectiveSeller,
  saveSellerStore,
} from "../../seller/lib/sellerAccountStorage";
import { ensureParticipantSessionCookie } from "../../seller/lib/sellerSession";
import {
  type AnnouncementPayload,
  type AnnouncementSpeed,
  type AnnouncementStatus,
  createAnnouncementPayload,
} from "../../../lib/announcements/types";
import AdminFooter from "../../admin/components/layout/AdminFooter";
import ParticipantAnnouncementBar from "./ParticipantAnnouncementBar";
import { participantNavigationItems } from "../participantNavigation";

type ParticipantAnnouncementView = {
  participantId: string;
  participantAnnouncement: AnnouncementPayload | null;
  participant: {
    participantId: string;
    active: AnnouncementPayload | null;
    latestSaved: AnnouncementPayload | null;
    previousSaved: AnnouncementPayload | null;
    enabled: boolean;
    broadcastRevision: number;
    lastBroadcastAt: string | null;
    status: AnnouncementStatus;
    updatedAt: string;
  } | null;
};

const PARTICIPANT_ANNOUNCEMENT_ENDPOINT = "/api/participant/announcement/";

function getParticipantAnnouncementUrl(participantId: string) {
  if (!participantId.trim()) {
    throw new Error("participantId-required");
  }
  return `${PARTICIPANT_ANNOUNCEMENT_ENDPOINT}?participantId=${encodeURIComponent(participantId)}`;
}

async function loadParticipantAnnouncement(
  participantId: string,
  signal?: AbortSignal,
) {
  const response = await fetch(getParticipantAnnouncementUrl(participantId), {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error("announcement-load-failed");
  }
  return response.json() as Promise<ParticipantAnnouncementView>;
}

async function saveParticipantAnnouncement(
  participantId: string,
  payload: AnnouncementPayload,
) {
  const response = await fetch(PARTICIPANT_ANNOUNCEMENT_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      target: "participant",
      participantId,
      operation: "save",
      payload,
    }),
  });
  if (!response.ok) {
    throw new Error("announcement-save-failed");
  }
  return response.json() as Promise<ParticipantAnnouncementView>;
}

async function restoreParticipantAnnouncement(participantId: string) {
  const response = await fetch(PARTICIPANT_ANNOUNCEMENT_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      target: "participant",
      participantId,
      operation: "restore",
    }),
  });
  if (!response.ok) {
    throw new Error("announcement-restore-failed");
  }
  return response.json() as Promise<ParticipantAnnouncementView>;
}

function notifyParticipantAnnouncementUpdated(
  participantId: string,
  view: ParticipantAnnouncementView,
) {
  window.dispatchEvent(
    new CustomEvent("participant-announcement-change", {
      detail: {
        ...view,
        participantId,
      },
    }),
  );
}

const emptyAnnouncement = createAnnouncementPayload({ ar: "", de: "", en: "", fr: "" });

const announcementTitles = {
  ar: "إعلان المشارك",
  de: "Teilnehmeranzeige",
  en: "Participant Announcement",
  fr: "Annonce du participant",
} as const;

const restoreFeedback = {
  ar: "لا يوجد إعلان محفوظ لاسترجاعه.",
  de: "Es ist keine gespeicherte Meldung vorhanden.",
  en: "No saved announcement is available to restore.",
  fr: "Aucune annonce enregistrée ne peut être restaurée.",
} as const;

const saveFeedback = {
  ar: "تعذر حفظ إعلان المشارك.",
  de: "Die Teilnehmer-Anzeige konnte nicht gespeichert werden.",
  en: "The participant announcement could not be saved.",
  fr: "L’annonce du participant n’a pas pu être enregistrée.",
} as const;

const saveSuccessFeedback = {
  ar: "تم حفظ إعلان المشارك بنجاح.",
  de: "Die Teilnehmer-Anzeige wurde erfolgreich gespeichert.",
  en: "The participant announcement was saved successfully.",
  fr: "L’annonce du participant a été enregistrée.",
} as const;

const previewSuccessFeedback = {
  ar: "تم تحديث المعاينة.",
  de: "Die Vorschau wurde aktualisiert.",
  en: "The preview was updated.",
  fr: "L’aperçu a été mis à jour.",
} as const;

const restoreSuccessFeedback = {
  ar: "تم استرجاع إعلان المشارك.",
  de: "Die Teilnehmer-Anzeige wurde wiederhergestellt.",
  en: "The participant announcement was restored.",
  fr: "L’annonce du participant a été restaurée.",
} as const;

type ParticipantStudioShellProps = {
  children: ReactNode;
  participantId: string;
  viewerRole?: "participant" | "admin";
};

export default function ParticipantStudioShell({
  children,
  participantId,
  viewerRole = "participant",
}: ParticipantStudioShellProps) {
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();
  const isParticipantRoot =
    viewerRole === "participant" &&
    (pathname === "/participant" || pathname === "/participant/");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServiceCenterOpen, setIsServiceCenterOpen] = useState(false);
  const [isAnnouncementEditorOpen, setIsAnnouncementEditorOpen] = useState(false);
  const [
    isParticipantAnnouncementVisible,
    setIsParticipantAnnouncementVisible,
  ] = useState(false);
  const [announcementFeedback, setAnnouncementFeedback] = useState("");
  const [announcementView, setAnnouncementView] = useState<ParticipantAnnouncementView | null>(null);
  const [participantAnnouncement, setParticipantAnnouncement] =
    useState<AnnouncementPayload | null>(null);
  const [savedParticipantAnnouncement, setSavedParticipantAnnouncement] =
    useState<AnnouncementPayload | null>(null);
  const [participantAnimationRevision, setParticipantAnimationRevision] =
    useState(0);
  const [participantAnnouncementSpeed, setParticipantAnnouncementSpeed] =
    useState<AnnouncementSpeed>("normal");
  const initializedVisibilityParticipantRef = useRef<string | null>(null);
  const serviceCenterTriggerRef = useRef<HTMLButtonElement>(null);
  const direction = lang === "ar" ? "rtl" : "ltr";
  const participantAccount = getEffectiveSeller(participantId);
  const participantLogoReference =
    participantAccount?.store.logoUrl ??
    announcementView?.participant?.latestSaved?.logoReference;
  const profileLogoReference =
    participantLogoReference ??
    publicPath("/logo-dekokraft-600.webp");
  const participantName =
    participantAccount?.store.storeName ?? participantAccount?.ownerName;
  const restartParticipantAnimation = useCallback(() => {
    setParticipantAnimationRevision((current) => current + 1);
  }, []);
  const dismissServiceCenter = useCallback(() => {
    setIsServiceCenterOpen(false);
  }, []);
  const closeServiceCenterForNavigation = useCallback(() => {
    setIsServiceCenterOpen(false);
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    ensureParticipantSessionCookie({
      role: "participant",
      participantId,
    });
  }, [participantId]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeMenu = (event: PointerEvent) => {
      if (isServiceCenterOpen) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest(".participant-menu-action") ||
        target.closest(".publicQuickMenu")
      ) {
        return;
      }
      setIsMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isServiceCenterOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [isMenuOpen, isServiceCenterOpen]);

  function synchronizeAnnouncementView(view: ParticipantAnnouncementView) {
    const restoredLogo = view.participant?.latestSaved?.logoReference;
    const seller = getEffectiveSeller(participantId);
    if (restoredLogo && seller && seller.store.logoUrl !== restoredLogo) {
      saveSellerStore(participantId, {
        ...seller.store,
        logoUrl: restoredLogo,
      });
    }
    setAnnouncementView(view);
    setParticipantAnnouncement(view.participantAnnouncement);
    setSavedParticipantAnnouncement(view.participantAnnouncement);
    setParticipantAnnouncementSpeed(
      view.participantAnnouncement?.speed ?? "normal",
    );
    setIsParticipantAnnouncementVisible(
      Boolean(view.participantAnnouncement) &&
        view.participant?.enabled !== false,
    );
    restartParticipantAnimation();
    notifyParticipantAnnouncementUpdated(participantId, view);
  }

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const refreshAnnouncement = () => {
      void loadParticipantAnnouncement(participantId, controller.signal).then((view) => {
        if (active) {
          setAnnouncementView(view);
          setParticipantAnnouncement(view.participantAnnouncement);
          setSavedParticipantAnnouncement(view.participantAnnouncement);
          setParticipantAnnouncementSpeed(
            view.participantAnnouncement?.speed ?? "normal",
          );
          if (initializedVisibilityParticipantRef.current !== participantId) {
            initializedVisibilityParticipantRef.current = participantId;
            setIsParticipantAnnouncementVisible(
              Boolean(view.participantAnnouncement) &&
                view.participant?.enabled !== false,
            );
          }
          restartParticipantAnimation();
        }
      })
      .catch(() => undefined);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshAnnouncement();
    };
    refreshAnnouncement();
    const refreshInterval = window.setInterval(refreshAnnouncement, 5_000);
    window.addEventListener("focus", refreshAnnouncement);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshAnnouncement);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [
    participantId,
    restartParticipantAnimation,
    viewerRole,
  ]);

  useEffect(() => {
    const refreshProfileLogo = () => {
      setAnnouncementView((current) => current ? { ...current } : current);
      restartParticipantAnimation();
    };
    const receiveAnnouncementUpdate = (event: Event) => {
      const view = (event as CustomEvent<ParticipantAnnouncementView>).detail;
      if (view?.participantId === participantId) {
        setAnnouncementView(view);
        setParticipantAnnouncement(view.participantAnnouncement);
        setSavedParticipantAnnouncement(view.participantAnnouncement);
        setParticipantAnnouncementSpeed(
          view.participantAnnouncement?.speed ?? "normal",
        );
        restartParticipantAnimation();
      }
    };
    window.addEventListener("seller-account-change", refreshProfileLogo);
    window.addEventListener(
      "participant-announcement-change",
      receiveAnnouncementUpdate,
    );
    return () => {
      window.removeEventListener("seller-account-change", refreshProfileLogo);
      window.removeEventListener(
        "participant-announcement-change",
        receiveAnnouncementUpdate,
      );
    };
  }, [participantId, restartParticipantAnimation]);

  async function handleRestoreAnnouncement() {
    setAnnouncementFeedback("");
    try {
      const view = await restoreParticipantAnnouncement(participantId);
      synchronizeAnnouncementView(view);
      setAnnouncementFeedback(restoreSuccessFeedback[lang]);
      return view.participant?.latestSaved ?? undefined;
    } catch (error) {
      console.error("[Participant announcement restore]", error);
      setAnnouncementFeedback(restoreFeedback[lang]);
      return undefined;
    } finally {
      restartParticipantAnimation();
    }
  }

  function handleParticipantAnnouncementButton() {
    if (isParticipantAnnouncementVisible) {
      setIsParticipantAnnouncementVisible(false);
      return;
    }
    setIsAnnouncementEditorOpen(true);
  }

  if (
    viewerRole === "participant" &&
    (pathname === "/participant/brand-studio" ||
      pathname === "/participant/brand-studio/")
  ) {
    return <>{children}</>;
  }

  const participantActions = {
    menu: (
      <HomeToolbarIconButton
        key="menu"
        data-participant-action="menu"
        className="participant-action participant-menu-action"
        icon={(
          <HomeToolbarIcon>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </HomeToolbarIcon>
        )}
        label={t("toolbar.menu")}
        aria-label={t("toolbar.menu")}
        title={t("toolbar.menu")}
        type="button"
        aria-expanded={isMenuOpen}
        aria-controls="participant-quick-menu"
        aria-haspopup="menu"
        active={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      />
    ),
    profile: (
      <HomeToolbarIconButton
        key="profile"
        data-participant-action="profile"
        className="participant-action"
        icon={(
          <HomeToolbarIcon>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
          </HomeToolbarIcon>
        )}
        label={t("toolbar.account")}
        aria-label={t("toolbar.account")}
        title={t("toolbar.account")}
        href={routes.participant.root}
      />
    ),
    home: (
      <HomeToolbarIconButton
        key="home"
        data-participant-action="home"
        className="participant-action"
        icon={<Home aria-hidden="true" />}
        label={t("buttons.save")}
        aria-label={t("buttons.save")}
        title={t("buttons.save")}
        type="button"
      />
    ),
    favorite: (
      <HomeToolbarIconButton
        key="favorite"
        data-participant-action="favorite"
        className="participant-action"
        icon={(
          <HomeToolbarIcon>
            <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />
          </HomeToolbarIcon>
        )}
        label={t("toolbar.favorites")}
        aria-label={t("toolbar.favorites")}
        title={t("toolbar.favorites")}
        href="/info/favorites"
      />
    ),
    notifications: (
      <HomeToolbarIconButton
        key="notifications"
        data-participant-action="notifications"
        className="participant-action"
        icon={<BellRing aria-hidden="true" />}
        label={t("toolbar.participantAnnouncements")}
        aria-label={t("toolbar.participantAnnouncements")}
        title={t("toolbar.participantAnnouncements")}
        type="button"
        active={isParticipantAnnouncementVisible}
        onClick={handleParticipantAnnouncementButton}
      />
    ),
  } as const;
  const participantActionOrder = [
    "menu",
    "profile",
    "home",
    "favorite",
    "notifications",
  ] as const;

  return (
    <PublicPageShell
      chrome={(
        <div className="publicSiteChrome">
          {isParticipantAnnouncementVisible && participantAnnouncement && (
            <div className="participantNotificationColumn">
              <ParticipantAnnouncementBar
                lang={lang}
                participantId={participantId}
                participantName={participantName}
                participantLogoUrl={participantLogoReference ?? undefined}
                announcement={participantAnnouncement}
                enabled={announcementView?.participant?.enabled}
                broadcastRevision={
                  announcementView?.participant?.broadcastRevision ?? 0
                }
                animationRevision={participantAnimationRevision}
                speed={participantAnnouncementSpeed}
              />
            </div>
          )}
          <HomepageHeaderFrame dir={direction}>
            <div
              className="participant-toolbar dashboard-toolbar"
              dir={direction}
            >
              <nav
                className="participant-actions dashboard-actions"
                aria-label={t("participantStudio.navigationLabel")}
              >
                {participantActionOrder.map(
                  (actionKey) => participantActions[actionKey],
                )}
              </nav>
              <div
                className="participant-toolbar-spacer dashboard-toolbar-spacer"
                aria-hidden="true"
              />
              <DkToolbarGroup
                position="end"
                className="participant-utilities toolbarUtilityActions dashboard-utilities"
              >
                <span className="toolbarUtilityLanguage">
                  <DkLanguageMenu
                    className="publicLanguage toolbarLanguage"
                    language={lang}
                    direction={direction}
                    label={t("toolbar.language")}
                    onChange={setLang}
                  />
                </span>
                <span className="toolbarUtilitySettings">
                  <HomeToolbarIconButton
                    className="publicSettingsButton toolbarSettings"
                    icon={(
                      <HomeToolbarIcon>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
                      </HomeToolbarIcon>
                    )}
                    label={t("toolbar.settings")}
                    aria-label={t("toolbar.settings")}
                    title={t("toolbar.settings")}
                    href={routes.participant.settings}
                  />
                </span>
              </DkToolbarGroup>
            </div>
            {isMenuOpen && (
              <nav
                id="participant-quick-menu"
                className="publicQuickMenu"
                role="menu"
                dir={direction}
                aria-label={t("toolbar.menu")}
              >
                {participantNavigationItems
                  .filter((item) => item.enabled)
                  .map((item) => (
                    <Link
                      key={item.key}
                      role="menuitem"
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))}
                <button
                  ref={serviceCenterTriggerRef}
                  type="button"
                  role="menuitem"
                  aria-haspopup="dialog"
                  aria-controls="public-service-center-dialog"
                  aria-expanded={isServiceCenterOpen}
                  onClick={() => setIsServiceCenterOpen((open) => !open)}
                >
                  {isServiceCenterOpen
                    ? t("servicesCenter.close")
                    : t("servicesCenter.open")}
                </button>
              </nav>
            )}
          </HomepageHeaderFrame>
          <PublicServiceCenterModal
            isOpen={isServiceCenterOpen}
            onDismiss={dismissServiceCenter}
            onNavigate={closeServiceCenterForNavigation}
            returnFocusRef={serviceCenterTriggerRef}
          />
        </div>
      )}
    >
      <HomepageLayout>
        <HomepageMain
          className={isParticipantRoot ? "participant-page" : undefined}
          dir={direction}
          data-dir={direction}
        >
          {isParticipantRoot ? (
            <HomepageSurface className="participant-empty-content-surface">
              {null}
            </HomepageSurface>
          ) : (
            <>
              <DkPageHero
                className="homeHero participant-homepage-hero publicContentContainer"
                title={(
                  <span className="dekokraftBrand">
                    <DkBrand
                      className="participantStudioBrand"
                      name={t("header.brand")}
                      mediaSrc={publicPath("/videos/logo/logo.mp4")}
                      mediaType="video"
                      mediaAlt="DekoKraft"
                      fallbackImageSrc={publicPath("/logo-dekokraft-600.webp")}
                      href="/home"
                    />
                    <span>{t("participantStudio.title")}</span>
                  </span>
                )}
                description="مساحة موحدة لإدارة منتجاتك وطلباتك وصورك وإحصاءات متجرك من مكان واحد."
                size="large"
              />
              <DkContentSection className="publicContentContainer">
                {children}
              </DkContentSection>
              <AdminFooter
                lang={lang}
                version="DekoKraft Participant Studio"
                rights=""
              />
            </>
          )}
        </HomepageMain>
      </HomepageLayout>
      {isAnnouncementEditorOpen && (
        <AnnouncementEditorModal
          isOpen={isAnnouncementEditorOpen}
          announcementType="participant"
          title={announcementTitles[lang]}
          lang={lang}
          initialValues={
            announcementView?.participant?.latestSaved?.messages ??
            emptyAnnouncement.messages
          }
          initialFormatting={
            announcementView?.participant?.latestSaved?.formatting ??
            emptyAnnouncement.formatting
          }
          initialLanguage={
            announcementView?.participant?.latestSaved?.language ?? lang
          }
          initialBannerThickness={
            announcementView?.participant?.latestSaved?.bannerThickness ??
            announcementView?.participant?.latestSaved?.bannerHeight
          }
          initialBannerLength={
            announcementView?.participant?.latestSaved?.bannerLength ??
            announcementView?.participant?.latestSaved?.bannerWidth
          }
          initialTextColor={
            announcementView?.participant?.latestSaved?.textColor
          }
          initialBackgroundColor={
            announcementView?.participant?.latestSaved?.backgroundColor
          }
          initialImageReference={
            announcementView?.participant?.latestSaved?.imageReference
          }
          initialLogoSize={
            announcementView?.participant?.latestSaved?.logoSize ?? 48
          }
          initialSpeed={
            announcementView?.participant?.latestSaved?.speed ??
            participantAnnouncementSpeed
          }
          revision={announcementView?.participant?.updatedAt ?? "empty"}
          currentLogoUrl={profileLogoReference}
          currentLogoAlt={announcementTitles[lang]}
          feedback={announcementFeedback}
          onDraftChange={restartParticipantAnimation}
          onCancel={() => {
            setParticipantAnnouncement(savedParticipantAnnouncement);
            setParticipantAnnouncementSpeed(
              savedParticipantAnnouncement?.speed ?? "normal",
            );
            setIsAnnouncementEditorOpen(false);
            restartParticipantAnimation();
          }}
          onPreview={async (payload) => {
            setAnnouncementFeedback("");
            setParticipantAnnouncement(payload);
            setParticipantAnnouncementSpeed(payload.speed ?? "normal");
            setAnnouncementFeedback(previewSuccessFeedback[lang]);
            restartParticipantAnimation();
          }}
          onSave={async (payload) => {
            setAnnouncementFeedback("");
            try {
              const view = await saveParticipantAnnouncement(
                participantId,
                payload,
              );
              const savedAnnouncement =
                view.participant?.latestSaved ?? view.participantAnnouncement;
              if (!savedAnnouncement) {
                throw new Error("announcement-save-response-missing");
              }
              synchronizeAnnouncementView({
                ...view,
                participantAnnouncement: savedAnnouncement,
              });
              setParticipantAnnouncementSpeed(
                savedAnnouncement.speed ?? "normal",
              );
              setIsParticipantAnnouncementVisible(true);
              setAnnouncementFeedback(saveSuccessFeedback[lang]);
              setIsAnnouncementEditorOpen(false);
            } catch (error) {
              console.error("[Participant announcement save]", error);
              setAnnouncementFeedback(saveFeedback[lang]);
              throw error;
            } finally {
              restartParticipantAnimation();
            }
          }}
          onRestoreDefault={handleRestoreAnnouncement}
        />
      )}
    </PublicPageShell>
  );
}
