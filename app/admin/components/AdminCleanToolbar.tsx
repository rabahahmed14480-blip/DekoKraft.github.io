"use client";

import {
  BellRing,
  BookOpen,
  CircleGauge,
  Heart,
  Home,
  Megaphone,
  Menu,
  PanelsTopLeft,
  Settings,
  UserRound,
} from "lucide-react";
import type { Lang } from "../../../locales";
import HomeToolbarIconButton from "../../components/home-v2/HomeToolbarIconButton";
import { DkLanguageMenu, DkToolbarGroup } from "../../components/ui";
import { routes } from "../../config/routes";

type AdminCleanToolbarProps = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isMenuOpen: boolean;
  isAnnouncementActive: boolean;
  isParticipantAnnouncementActive: boolean;
  onToggleMenu: () => void;
  onToggleAnnouncement: () => void;
  onToggleParticipantAnnouncement: () => void;
};

export default function AdminCleanToolbar({
  lang,
  setLang,
  isMenuOpen,
  isAnnouncementActive,
  isParticipantAnnouncementActive,
  onToggleMenu,
  onToggleAnnouncement,
  onToggleParticipantAnnouncement,
}: AdminCleanToolbarProps) {
  const direction = lang === "ar" ? "rtl" : "ltr";
  const actions = {
    menu: (
      <HomeToolbarIconButton
        key="menu"
        className="participant-action"
        icon={<Menu aria-hidden="true" />}
        label="Menu"
        aria-label="Menu"
        title="Menu"
        type="button"
        aria-controls="dk-admin-clean-navigation"
        aria-expanded={isMenuOpen}
        onClick={onToggleMenu}
      />
    ),
    profile: (
      <HomeToolbarIconButton
        key="profile"
        className="participant-action"
        icon={<UserRound aria-hidden="true" />}
        label="Profile"
        aria-label="Profile"
        title="Profile"
        type="button"
      />
    ),
    home: (
      <HomeToolbarIconButton
        key="home"
        className="participant-action"
        icon={<Home aria-hidden="true" />}
        label="Home"
        aria-label="Home"
        title="Home"
        href={routes.home}
      />
    ),
    favorite: (
      <HomeToolbarIconButton
        key="favorite"
        className="participant-action"
        icon={<Heart aria-hidden="true" />}
        label="Favorite"
        aria-label="Favorite"
        title="Favorite"
        href={routes.info("favorites")}
      />
    ),
    notification: (
      <HomeToolbarIconButton
        key="notification"
        className="participant-action"
        icon={<BellRing aria-hidden="true" />}
        label="Main Announcement"
        aria-label="Main Announcement"
        title="Main Announcement"
        type="button"
        active={isAnnouncementActive}
        onClick={onToggleAnnouncement}
      />
    ),
    "participant-announcement": (
      <HomeToolbarIconButton
        key="participant-announcement"
        className="participant-action"
        icon={<Megaphone aria-hidden="true" />}
        label="Participant Announcement"
        aria-label="Participant Announcement"
        title="Participant Announcement"
        type="button"
        active={isParticipantAnnouncementActive}
        onClick={onToggleParticipantAnnouncement}
      />
    ),
    "page-designs": (
      <HomeToolbarIconButton
        key="page-designs"
        className="participant-action"
        icon={<PanelsTopLeft aria-hidden="true" />}
        label={lang === "ar" ? "تصاميم الصفحة" : "Page Designs"}
        aria-label={lang === "ar" ? "تصاميم الصفحة" : "Page Designs"}
        title={lang === "ar" ? "تصاميم الصفحة" : "Page Designs"}
        href={routes.admin.pageDesigns}
      />
    ),
    knowledge: (
      <HomeToolbarIconButton
        key="knowledge"
        className="participant-action"
        icon={<BookOpen aria-hidden="true" />}
        label={lang === "ar" ? "قاعدة المعرفة" : "Knowledge Base"}
        aria-label={lang === "ar" ? "قاعدة المعرفة" : "Knowledge Base"}
        title={lang === "ar" ? "قاعدة المعرفة" : "Knowledge Base"}
        href={routes.admin.knowledge}
      />
    ),
    "mission-control": (
      <HomeToolbarIconButton
        key="mission-control"
        className="participant-action"
        icon={<CircleGauge aria-hidden="true" />}
        label={lang === "ar" ? "مركز القيادة" : "Mission Control"}
        aria-label={lang === "ar" ? "مركز القيادة" : "Mission Control"}
        title={lang === "ar" ? "مركز القيادة" : "Mission Control"}
        href={routes.admin.missionControl}
      />
    ),
  } as const;
  const actionOrder = [
    "menu",
    "profile",
    "home",
    "favorite",
    "notification",
    "participant-announcement",
    "page-designs",
    "knowledge",
    "mission-control",
  ] as const;

  return (
    <div
      className="participant-toolbar admin-clean-toolbar dashboard-toolbar"
      dir={direction}
    >
      <nav
        className="participant-actions admin-clean-actions dashboard-actions"
        aria-label="Admin actions"
      >
        {actionOrder.map((action) => actions[action])}
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
            label="Language"
            onChange={setLang}
          />
        </span>
        <span className="toolbarUtilitySettings">
          <HomeToolbarIconButton
            className="publicSettingsButton toolbarSettings"
            icon={<Settings aria-hidden="true" />}
            label="Settings"
            aria-label="Settings"
            title="Settings"
            href="/admin/settings"
          />
        </span>
      </DkToolbarGroup>
    </div>
  );
}
