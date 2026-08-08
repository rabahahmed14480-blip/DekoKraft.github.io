"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { routes } from "../config/routes";
import { useLanguage } from "./LanguageProvider";
import HomeToolbarIconButton, {
  HomeToolbarIcon,
} from "./home-v2/HomeToolbarIconButton";
import PublicServiceCenterModal from "./PublicServiceCenterModal";
import DkLanguageMenu from "./ui/DkLanguageMenu";
import DkSearchBar from "./ui/DkSearchBar";
import DkToolbar from "./ui/DkToolbar";
import DkToolbarGroup from "./ui/DkToolbarGroup";
import { CompanionLauncher } from "./companion/CompanionUI";

type DkPublicToolbarProps = {
  accountHref?: string;
  actionClassName?: string;
  favoritesHref?: string;
  homeAppearance?: boolean;
  additionalAction?: ReactNode;
  mainActions?: ReactNode;
  mainActionsClassName?: string;
  marketAction?: ReactNode;
  marketHref?: string;
  menuItems?: Array<{ href: string; label: string }>;
  searchHref?: string;
  settingsHref?: string;
  showSearch?: boolean;
  toolbarClassName?: string;
};

export function DkPublicToolbar({
  accountHref = routes.login,
  actionClassName,
  favoritesHref = routes.info("favorites"),
  homeAppearance = false,
  additionalAction,
  mainActions,
  mainActionsClassName,
  marketAction,
  marketHref = routes.market,
  menuItems,
  searchHref = routes.market,
  settingsHref = routes.info("settings"),
  showSearch = true,
  toolbarClassName,
}: DkPublicToolbarProps = {}) {
  const { lang, setLang, direction, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServiceCenterOpen, setIsServiceCenterOpen] = useState(false);
  const serviceCenterTriggerRef = useRef<HTMLButtonElement>(null);

  const dismissServiceCenter = useCallback(() => {
    setIsServiceCenterOpen(false);
  }, []);

  const closeServiceCenterForNavigation = useCallback(() => {
    setIsServiceCenterOpen(false);
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeMenu = (event: PointerEvent) => {
      if (isServiceCenterOpen) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".publicMenuButton") || target.closest(".publicQuickMenu")) return;
      setIsMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isServiceCenterOpen) setIsMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [isMenuOpen, isServiceCenterOpen]);

  const search = (
    <DkSearchBar
      className="publicHeaderSearch"
      label={t("common.search")}
      placeholder={t("publicHeader.searchPlaceholder")}
      onSearch={(query) => {
        const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
        router.push(`${searchHref}${suffix}`);
      }}
    />
  );

  const menuButton = (
    <HomeToolbarIconButton
      className={`publicMenuButton${actionClassName ? ` ${actionClassName}` : ""}`}
      icon={
        <HomeToolbarIcon>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </HomeToolbarIcon>
      }
      label={t("toolbar.menu")}
      aria-label={t("toolbar.menu")}
      title={t("toolbar.menu")}
      type="button"
      aria-expanded={isMenuOpen}
      aria-controls="public-quick-menu"
      aria-haspopup="menu"
      active={isMenuOpen}
      onClick={() => setIsMenuOpen((open) => !open)}
    />
  );

  const accountButton = (
    <HomeToolbarIconButton
      className={actionClassName}
      icon={
        <HomeToolbarIcon>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
        </HomeToolbarIcon>
      }
      label={t("toolbar.account")}
      aria-label={t("toolbar.account")}
      title={t("toolbar.account")}
      href={accountHref}
    />
  );

  const favoritesButton = (
    <HomeToolbarIconButton
      className={actionClassName}
      icon={
        <HomeToolbarIcon>
          <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />
        </HomeToolbarIcon>
      }
      label={t("toolbar.favorites")}
      aria-label={t("toolbar.favorites")}
      title={t("toolbar.favorites")}
      href={favoritesHref}
    />
  );

  const marketButton = (
    <HomeToolbarIconButton
      className={`publicMarketButton${actionClassName ? ` ${actionClassName}` : ""}`}
      href={marketHref}
      icon={
        <HomeToolbarIcon>
          <path d="M4 9h16l-1-5H5L4 9Z" />
          <path d="M5 9v11h14V9M9 20v-6h6v6" />
        </HomeToolbarIcon>
      }
      label={t("toolbar.market")}
      aria-label={t("toolbar.market")}
      title={t("toolbar.market")}
    />
  );

  const settingsButton = (
    <HomeToolbarIconButton
      className="publicSettingsButton toolbarSettings"
      icon={
        <HomeToolbarIcon>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
        </HomeToolbarIcon>
      }
      label={t("toolbar.settings")}
      aria-label={t("toolbar.settings")}
      title={t("toolbar.settings")}
      href={settingsHref}
    />
  );

  const languageButton = (
    <DkLanguageMenu
      className="publicLanguage toolbarLanguage"
      language={lang}
      direction={direction}
      label={t("toolbar.language")}
      onChange={setLang}
    />
  );

  return (
    <>
      <DkToolbar
        className={`publicFloatingToolbar dashboard-toolbar${showSearch ? "" : " publicFloatingToolbar--actions-only"}${
          homeAppearance ||
          pathname === routes.home ||
          pathname === `${routes.home}/`
            ? " homeToolbar"
            : ""
        }${toolbarClassName ? ` ${toolbarClassName}` : ""}`}
        dir={direction}
        aria-label={t("publicHeader.actions")}
      >
        {mainActions ?? (
          <nav
            className={`publicSecondaryActions toolbarMainActions dashboard-actions${mainActionsClassName ? ` ${mainActionsClassName}` : ""}`}
            aria-label={t("publicHeader.actions")}
          >
            {menuButton}
            {accountButton}
            {marketAction ?? marketButton}
            {favoritesButton}
            <CompanionLauncher className={actionClassName} />
            {additionalAction}
          </nav>
        )}

        {showSearch && (
          <div className="publicHeaderSearchRow dashboard-toolbar-spacer">
            {search}
          </div>
        )}
        {!showSearch && (
          <div className="dashboard-toolbar-spacer" aria-hidden="true" />
        )}

        <DkToolbarGroup
          position="end"
          className="publicHeaderEndGroup toolbarUtilityActions dashboard-utilities"
        >
          <span className="toolbarUtilityLanguage">{languageButton}</span>
          <span className="toolbarUtilitySettings">{settingsButton}</span>
        </DkToolbarGroup>
      </DkToolbar>
      {isMenuOpen && (
        <nav id="public-quick-menu" className="publicQuickMenu" role="menu" dir={direction} aria-label={t("toolbar.menu")}>
          {(menuItems ?? [
            { href: routes.home, label: t("welcome.cards.home") },
            { href: routes.market, label: t("welcome.cards.market") },
            { href: routes.info("about"), label: t("welcome.cards.about") },
          ]).map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              role="menuitem"
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
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
            {isServiceCenterOpen ? t("servicesCenter.close") : t("servicesCenter.open")}
          </button>
          <Link role="menuitem" href={accountHref} onClick={() => setIsMenuOpen(false)}>{t("welcome.cards.login")}</Link>
        </nav>
      )}
      <PublicServiceCenterModal
        isOpen={isServiceCenterOpen}
        onDismiss={dismissServiceCenter}
        onNavigate={closeServiceCenterForNavigation}
        returnFocusRef={serviceCenterTriggerRef}
      />
    </>
  );
}

export default DkPublicToolbar;
