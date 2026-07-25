"use client";

import { BellRing, Heart, Home, Megaphone, Menu, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "../../../locales";
import { createTranslator } from "../../../locales";
import {
  DkIconButton,
  DkToolbar,
  DkToolbarGroup,
  readMenuAnchor,
  type DkMenuAnchor,
} from "../../components/ui";

type AdminTopToolbarProps = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isMenuOpen: boolean;
  onToggleMenu: (anchor: DkMenuAnchor) => void;
  onEditAnnouncement: () => void;
  onOpenMainAnnouncement: () => void;
  isParticipantAnnouncementActive: boolean;
  isMainAnnouncementActive: boolean;
};

const languageOptions: Array<{ code: Lang; flag: string; label: string }> = [
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
];

export default function AdminTopToolbar({
  lang,
  setLang,
  isMenuOpen,
  onToggleMenu,
  onEditAnnouncement,
  onOpenMainAnnouncement,
  isParticipantAnnouncementActive,
  isMainAnnouncementActive,
}: AdminTopToolbarProps) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLSpanElement>(null);
  const isArabic = lang === "ar";
  const t = createTranslator(lang);
  const activeLanguage = languageOptions.find((option) => option.code === lang) ?? languageOptions[0];

  useEffect(() => {
    const closeLanguageMenu = (event: PointerEvent) => {
      if (!languageRef.current?.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLanguageOpen(false);
    };

    document.addEventListener("pointerdown", closeLanguageMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeLanguageMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    setIsLanguageOpen(false);
  }, [lang]);

  const settingsButton = (
    <DkIconButton
      href="/admin/settings"
      icon={<Settings />}
      label={t("toolbar.openSettings")}
      className="publicHeaderIconButton adminHomeToolbarButton"
      variant="glass"
      size="sm"
    />
  );

  const languageButton = (
    <div className="publicLanguage adminHomeToolbarLanguage" ref={languageRef}>
      <DkIconButton
        icon={(
                <span className="adminHomeToolbarLanguageValue">
            <span aria-hidden="true">{activeLanguage.flag}</span>
            <span>{activeLanguage.code.toUpperCase()}</span>
          </span>
        )}
        label={t("toolbar.changeLanguage")}
        className="publicHeaderIconButton adminHomeToolbarButton adminHomeToolbarLanguageButton"
        variant="glass"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={isLanguageOpen}
        onClick={() => setIsLanguageOpen((open) => !open)}
      />
      {isLanguageOpen && (
        <div className="publicLanguageMenu adminHomeToolbarLanguageMenu" role="menu" dir={isArabic ? "rtl" : "ltr"}>
          {languageOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              role="menuitemradio"
              aria-checked={option.code === lang}
              onClick={() => {
                setLang(option.code);
                setIsLanguageOpen(false);
              }}
            >
              <span aria-hidden="true">{option.flag}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const favoritesButton = (
    <DkIconButton
      href="/info/favorites"
      icon={<Heart />}
      label={t("toolbar.favorites")}
      className="publicHeaderIconButton adminHomeToolbarButton"
      variant="glass"
      size="sm"
    />
  );

  const profileButton = (
    <DkIconButton
      icon={<UserRound />}
      label={t("toolbar.account")}
      className="publicHeaderIconButton adminHomeToolbarButton adminHomeToolbarAvatar"
      variant="glass"
      size="sm"
    />
  );

  const homeButton = (
    <DkIconButton
      href="/admin"
      icon={<Home />}
      label={t("admin.dashboard.pageTitle")}
      className="publicHeaderIconButton adminHomeToolbarButton"
      variant="glass"
      size="sm"
    />
  );

  const menuButton = (
    <span className="adminHomeToolbarMenuAnchor" ref={menuRef}>
      <DkIconButton
        icon={<Menu />}
        label={t("toolbar.openMenu")}
        className="publicHeaderIconButton adminHomeToolbarButton"
        variant="glass"
        size="sm"
        aria-controls="dk-admin-navigation"
        aria-expanded={isMenuOpen}
        onClick={() => {
          if (menuRef.current) onToggleMenu(readMenuAnchor(menuRef.current));
        }}
      />
    </span>
  );

  const announcementButton = (
    <button
      type="button"
      className={`adminHomeAnnouncementEditButton${isParticipantAnnouncementActive ? " active" : ""}`}
      onClick={onEditAnnouncement}
      aria-pressed={isParticipantAnnouncementActive}
    >
      <Megaphone aria-hidden="true" />
      <span>{t("toolbar.participantAnnouncements")}</span>
    </button>
  );

  const mainAnnouncementButton = (
    <button
      type="button"
      className={`adminHomeAnnouncementEditButton${isMainAnnouncementActive ? " active" : ""}`}
      onClick={onOpenMainAnnouncement}
      aria-pressed={isMainAnnouncementActive}
    >
      <BellRing aria-hidden="true" />
      <span>{t("toolbar.mainAnnouncement")}</span>
    </button>
  );

  return (
    <DkToolbar className="publicFloatingToolbar adminHomeToolbar" aria-label="Admin toolbar">
      <nav className="publicSecondaryActions" dir={isArabic ? "rtl" : "ltr"} aria-label="Admin actions">
        {menuButton}
        {homeButton}
        {profileButton}
        {favoritesButton}
        {announcementButton}
        {mainAnnouncementButton}
      </nav>
      <div className="publicHeaderSearchRow adminHomeToolbarSpacer" aria-hidden="true" />
      <DkToolbarGroup position="end" className="publicHeaderEndGroup">
        {settingsButton}
        {languageButton}
      </DkToolbarGroup>
    </DkToolbar>
  );
}
