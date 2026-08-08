"use client";

import { useEffect, useState, type ReactNode } from "react";
import AnnouncementEditorModal from "../../components/announcements/AnnouncementEditorModal";
import { useLanguage } from "../../components/LanguageProvider";
import { publicPath } from "../../lib/publicPath";
import {
  createAnnouncementPayload,
  type AnnouncementPayload,
  type AnnouncementStatus,
} from "../../../lib/announcements/types";
import SellerAccountHeader from "./SellerAccountHeader";
import SellerRouteGuard from "./SellerRouteGuard";
import SellerSessionProvider from "./SellerSessionProvider";
import SellerSidebar from "./SellerSidebar";
import SellerTopToolbar from "./SellerTopToolbar";
import {
  getEffectiveSeller,
  saveSellerStore,
} from "../lib/sellerAccountStorage";

type ParticipantAnnouncementView = {
  participantId: string;
  participantAnnouncement: AnnouncementPayload | null;
  participant: {
    participantId: string;
    active: AnnouncementPayload | null;
    latestSaved: AnnouncementPayload | null;
    status: AnnouncementStatus;
    updatedAt: string;
  } | null;
};

const emptyAnnouncement = createAnnouncementPayload({ ar: "", de: "", en: "", fr: "" });

const announcementTitles = {
  ar: "إعلان المشارك",
  de: "Teilnehmeranzeige",
  en: "Participant Announcement",
  fr: "Annonce du participant",
} as const;

function ProtectedStudio({ sellerId, children }: { sellerId: string; children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnnouncementEditorOpen, setIsAnnouncementEditorOpen] = useState(false);
  const [announcementView, setAnnouncementView] = useState<ParticipantAnnouncementView | null>(null);
  const { lang } = useLanguage();
  const profileLogoReference =
    getEffectiveSeller(sellerId)?.store.logoUrl ??
    announcementView?.participant?.latestSaved?.logoReference ??
    publicPath("/logo-dekokraft-600.webp");

  function synchronizeAnnouncementView(view: ParticipantAnnouncementView) {
    const restoredLogo = view.participant?.latestSaved?.logoReference;
    const seller = getEffectiveSeller(sellerId);
    if (restoredLogo && seller && seller.store.logoUrl !== restoredLogo) {
      saveSellerStore(sellerId, {
        ...seller.store,
        logoUrl: restoredLogo,
      });
    }
    setAnnouncementView(view);
    window.dispatchEvent(
      new CustomEvent("participant-announcement-change", { detail: view }),
    );
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/participant/announcement/")
      .then(async (response) => {
        if (!response.ok) throw new Error("announcement-load-failed");
        return response.json() as Promise<ParticipantAnnouncementView>;
      })
      .then((view) => {
        if (active) setAnnouncementView(view);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [sellerId]);

  useEffect(() => {
    const refreshProfileLogo = () => {
      setAnnouncementView((current) => current ? { ...current } : current);
    };
    const receiveAnnouncementUpdate = (event: Event) => {
      const view = (event as CustomEvent<ParticipantAnnouncementView>).detail;
      if (view?.participantId === sellerId) setAnnouncementView(view);
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
  }, [sellerId]);

  return (
    <SellerRouteGuard sellerId={sellerId}>
      <div className="sellerShell" dir={lang === "ar" ? "rtl" : "ltr"}>
        <SellerSidebar
          sellerId={sellerId}
          isOpen={isMenuOpen}
          onNavigate={() => setIsMenuOpen(false)}
        />
        {isMenuOpen && (
          <button
            type="button"
            className="sellerSidebarBackdrop"
            aria-label="إغلاق القائمة"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
        <div className="sellerMain">
          <SellerTopToolbar
            sellerId={sellerId}
            isMenuOpen={isMenuOpen}
            isAnnouncementEditorOpen={isAnnouncementEditorOpen}
            onEditAnnouncement={() => setIsAnnouncementEditorOpen(true)}
            onToggleMenu={() => setIsMenuOpen((open) => !open)}
          />
          <SellerAccountHeader sellerId={sellerId} />
          {children}
        </div>
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
            initialLogoSize={
              announcementView?.participant?.latestSaved?.logoSize ?? 48
            }
            currentLogoUrl={profileLogoReference}
            currentLogoAlt={announcementTitles[lang]}
            onCancel={() => setIsAnnouncementEditorOpen(false)}
            onPreview={(payload) => {
              void fetch("/api/participant/announcement/", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  target: "participant",
                  participantId: sellerId,
                  operation: "save",
                  payload,
                }),
              })
                .then(async (response) => {
                  if (!response.ok) throw new Error("announcement-save-failed");
                  return response.json() as Promise<ParticipantAnnouncementView>;
                })
                .then((view) => {
                  synchronizeAnnouncementView(view);
                  setIsAnnouncementEditorOpen(false);
                });
            }}
            onRestoreDefault={() => {
              void fetch("/api/participant/announcement/", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  target: "participant",
                  participantId: sellerId,
                  operation: "restore",
                }),
              })
                .then(async (response) => {
                  if (!response.ok) throw new Error("announcement-restore-failed");
                  return response.json() as Promise<ParticipantAnnouncementView>;
                })
                .then((view) => {
                  synchronizeAnnouncementView(view);
                  setIsAnnouncementEditorOpen(false);
                });
            }}
          />
        )}
      </div>
    </SellerRouteGuard>
  );
}

export default function SellerProtectedLayout({
  sellerId,
  children,
}: {
  sellerId: string;
  children: ReactNode;
}) {
  return (
    <SellerSessionProvider>
      <ProtectedStudio sellerId={sellerId}>{children}</ProtectedStudio>
    </SellerSessionProvider>
  );
}
