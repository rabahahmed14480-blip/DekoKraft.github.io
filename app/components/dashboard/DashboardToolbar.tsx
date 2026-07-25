"use client";

import { Heart, Menu, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createTranslator, type Lang } from "../../../locales";
import {
  DkIconButton,
  readMenuAnchor,
  type DkMenuAnchor,
} from "../ui";

export type DashboardToolbarProps = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isMenuOpen?: boolean;
  onToggleMenu?: (anchor: DkMenuAnchor) => void;
  menuHref?: string;
  menuControlsId?: string;
  profileHref?: string;
  dashboardHref?: string;
  favoritesHref?: string;
  settingsHref?: string;
  menu?: ReactNode;
  identityImageSrc?: string;
  identityLabel?: string;
};

const languageOptions: Array<{ code: Lang; flag: string; label: string }> = [
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
];

export default function DashboardTopBar({
  lang,
  setLang,
  isMenuOpen = false,
  onToggleMenu,
  menuHref,
  menuControlsId = "dashboard-navigation",
  profileHref,
  favoritesHref = "/info/favorites",
  settingsHref,
  menu,
  identityImageSrc,
  identityLabel,
}: DashboardToolbarProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const menuAnchorRef = useRef<HTMLSpanElement>(null);
  const safeLang = lang ?? "ar";
  const isRtl = safeLang === "ar";
  const direction = isRtl ? "rtl" : "ltr";
  const previousLocaleRef = useRef(safeLang);
  const t = createTranslator(safeLang);
  const activeLanguage = languageOptions.find((option) => option.code === safeLang) ?? languageOptions[0];

  useEffect(() => {
    function close(event: MouseEvent) {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowLangMenu(false);
    }

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    if (previousLocaleRef.current === safeLang) return;

    setShowLangMenu(false);
    if (isMenuOpen && menuAnchorRef.current && onToggleMenu) {
      onToggleMenu(readMenuAnchor(menuAnchorRef.current));
    }
    previousLocaleRef.current = safeLang;
  }, [safeLang, isMenuOpen, onToggleMenu]);

  const menuControl = menuHref ? (
    <DkIconButton
      href={menuHref}
      icon={<Menu />}
      label={t("toolbar.openMenu")}
      className="dashboardToolbarControl dashboardToolbarMenu"
      size="sm"
      variant="glass"
    />
  ) : (
    <DkIconButton
      icon={<Menu />}
      label={t("toolbar.openMenu")}
      className="dashboardToolbarControl dashboardToolbarMenu"
      size="sm"
      variant="glass"
      aria-expanded={isMenuOpen}
      aria-controls={menuControlsId}
      onClick={() => {
        if (menuAnchorRef.current && onToggleMenu) {
          onToggleMenu(readMenuAnchor(menuAnchorRef.current));
        }
      }}
    />
  );

  return (
    <>
      <header
        className={`dashboardTopBar ${
          isRtl ? "dashboardTopBar--rtl" : "dashboardTopBar--ltr"
        }`}
        aria-label="DekoKraft toolbar"
        data-dashboard-toolbar="canonical"
        data-toolbar-side={isRtl ? "left" : "right"}
        data-toolbar-language={safeLang}
      >
        <div className="dashboardTopBarSecondary">
          <DkIconButton
            href={settingsHref}
            icon={<span aria-hidden="true">⚙️</span>}
            label={t("toolbar.openSettings")}
            className="dashboardToolbarControl dashboardToolbarSettings"
            size="sm"
            variant="glass"
          />
          <div className="dashboardToolbarLanguage" ref={languageRef}>
            <DkIconButton
              icon={(
                <span className="dashboardToolbarLanguageIndicator">
                  <span aria-hidden="true">{activeLanguage.flag}</span>
                  <span>{activeLanguage.code.toUpperCase()}</span>
                </span>
              )}
              label={t("toolbar.changeLanguage")}
              className="dashboardToolbarControl dashboardToolbarLanguageTrigger"
              size="sm"
              variant="glass"
              aria-haspopup="menu"
              aria-expanded={showLangMenu}
              onClick={() => setShowLangMenu((open) => !open)}
            />
            {showLangMenu && (
              <div
                className="dashboardToolbarLanguageMenu"
                role="menu"
                dir={direction}
              >
                {languageOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={option.code === safeLang}
                    onClick={() => {
                      if (isMenuOpen && menuAnchorRef.current && onToggleMenu) {
                        onToggleMenu(readMenuAnchor(menuAnchorRef.current));
                      }
                      setLang(option.code);
                      setShowLangMenu(false);
                    }}
                  >
                    <span><span aria-hidden="true">{option.flag}</span> {option.label}</span>
                    {option.code === safeLang && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="dashboardTopBarPrimary">
          <DkIconButton
            href={favoritesHref}
            icon={<Heart />}
            label={t("toolbar.favorites")}
            className="dashboardToolbarControl dashboardToolbarFavorites"
            size="sm"
            variant="glass"
          />
          <DkIconButton
            href={profileHref}
            icon={identityImageSrc ? (
              <span
                aria-hidden="true"
                className="dashboardProfileImage"
                style={{ backgroundImage: `url("${identityImageSrc}")` }}
              />
            ) : (
              <UserRound />
            )}
            label={identityLabel ?? t("toolbar.signIn")}
            className="dashboardToolbarControl dashboardToolbarProfile"
            size="sm"
            variant="glass"
          />
          <span className="dashboardToolbarMenuAnchor" ref={menuAnchorRef}>
            {menuControl}
          </span>
        </div>
      </header>
      {menu}
    </>
  );
}
