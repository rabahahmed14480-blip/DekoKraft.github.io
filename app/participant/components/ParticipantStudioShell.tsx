"use client";

import { useEffect, useState, type ReactNode } from "react";
import DekoKraftPageShell from "../../components/DekoKraftPageShell";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { useLanguage } from "../../components/LanguageProvider";
import { DkBrand, type DkMenuAnchor } from "../../components/ui";
import { publicPath } from "../../lib/publicPath";
import AdminFooter from "../../admin/components/layout/AdminFooter";
import ParticipantAnnouncementBar from "./ParticipantAnnouncementBar";
import ParticipantSidebar from "./ParticipantSidebar";
import ParticipantTopToolbar from "./ParticipantTopToolbar";

export default function ParticipantStudioShell({ children }: { children: ReactNode; participantId: string; viewerRole?: "participant" | "admin" }) {
  const { lang, setLang, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DkMenuAnchor | null>(null);
  const direction = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [isMenuOpen]);

  return (
    <DekoKraftPageShell
      className="participantPublicPageFrame"
      bodyClassName="participantPublicPageBody"
      chrome={(
        <div className="publicSiteChrome">
          <ParticipantAnnouncementBar lang={lang} />
          <header className="publicHeader" dir={direction}>
            <div className="publicHeaderMain publicContentContainer">
              <ParticipantTopToolbar
                lang={lang}
                setLang={setLang}
                isMenuOpen={isMenuOpen}
                onToggleMenu={(anchor) => {
                  setMenuAnchor(anchor);
                  setIsMenuOpen((open) => !open);
                }}
              />
            </div>
          </header>
        </div>
      )}
    >
      <main
        className="participantStudioShell"
        dir={direction}
        data-dir={direction}
        data-menu-open={isMenuOpen || undefined}
      >
        <ParticipantSidebar
          lang={lang}
          isOpen={isMenuOpen}
          anchor={menuAnchor}
          onClose={() => setIsMenuOpen(false)}
        />
        <DashboardShell
          direction={direction}
          className="participantStudioContent participantDashboardShell"
          logo={(
            <DkBrand
              className="participantStudioBrand"
              name={t("header.brand")}
              mediaSrc={publicPath("/videos/logo/logo.mp4")}
              mediaType="video"
              mediaAlt="DekoKraft"
              fallbackImageSrc={publicPath("/logo-dekokraft-600.webp")}
              href="/home"
            />
          )}
          title={t("participantStudio.title")}
          subtitle="مساحة موحدة لإدارة منتجاتك وطلباتك وصورك وإحصاءات متجرك من مكان واحد."
          identityClassName="participantDashboardIdentity"
          contentClassName="participantPageMain"
          footer={<AdminFooter lang={lang} version="DekoKraft Participant Studio" rights="" />}
        >
          {children}
        </DashboardShell>
      </main>
    </DekoKraftPageShell>
  );
}
