"use client";

import type { Lang } from "../../../locales";

type AdminAnnouncementBarProps = {
  language: Lang;
  announcements: Record<Lang, string>;
  direction?: "rtl" | "ltr";
};

const defaultAnnouncements: Record<Lang, string> = {
  ar: "مرحبًا بك في لوحة تحكم DekoKraft",
  de: "Willkommen im DekoKraft-Administrationsbereich",
  en: "Welcome to the DekoKraft administration dashboard",
  fr: "Bienvenue dans le tableau de bord administrateur DekoKraft",
};

export default function AdminAnnouncementBar({
  language,
  announcements,
  direction = "rtl",
}: AdminAnnouncementBarProps) {
  const normalizedLanguage: Lang =
    language?.toLowerCase().startsWith("de") ? "de" :
    language?.toLowerCase().startsWith("en") ? "en" :
    language?.toLowerCase().startsWith("fr") ? "fr" :
    "ar";
  const activeAnnouncement =
    announcements[normalizedLanguage]?.trim() ||
    announcements.ar?.trim() ||
    defaultAnnouncements[normalizedLanguage];

  if (process.env.NODE_ENV === "development") {
    console.log("[VisibleAdminTicker]", {
      rawLanguage: language,
      normalizedLanguage,
      activeAnnouncement,
      announcements,
    });
  }

  return (
    <div
      className={`publicAnnouncement adminHomeAnnouncement ${
        direction === "rtl"
          ? "adminAnnouncementBarRtl"
          : "adminAnnouncementBarLtr"
      }`}
      data-announcement-direction={direction}
      dir={direction}
      role="status"
    >
      <div className="publicContentContainer adminHomeAnnouncementContent">
        <span
          className="adminAnnouncementMovingText"
          data-direction={direction}
          data-announcement-moving="true"
          data-animation-debug="active"
        >
          {activeAnnouncement}
        </span>
      </div>
    </div>
  );
}
