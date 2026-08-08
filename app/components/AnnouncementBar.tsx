"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { translations, type Lang } from "../../locales";
import {
  DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR,
  DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
  DEFAULT_BANNER_LENGTH,
  DEFAULT_BANNER_THICKNESS,
  getAnnouncementDuration,
  type AnnouncementPayload,
  type AnnouncementSpeed,
} from "../../lib/announcements/types";
import { publicPath } from "../lib/publicPath";
import { useLanguage } from "./LanguageProvider";

export type AnnouncementStory = readonly [string, string, string, string];
type LocalizedAnnouncementText = Partial<Record<Lang, string>>;
type AnnouncementMessages = AnnouncementStory | LocalizedAnnouncementText;

export type AnnouncementTheme =
  | "default"
  | "spring"
  | "summer"
  | "autumn"
  | "winter"
  | "romantic"
  | "market"
  | "workshop"
  | "celebration";

type AnnouncementThemeSettings = {
  image: string;
  overlay: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
};

export const announcementThemes = {
  default: {
    image: "none",
    overlay:
      "linear-gradient(90deg, rgba(205, 145, 35, 0.68), rgba(247, 211, 118, 0.64), rgba(188, 119, 24, 0.68)), repeating-linear-gradient(92deg, rgba(101, 61, 20, 0.08) 0, rgba(101, 61, 20, 0.08) 2px, transparent 2px, transparent 15px)",
    textColor: "#3b2917",
    borderColor: "rgba(91, 57, 13, 0.28)",
    accentColor: "#6b4316",
  },
  spring: {
    image: "none",
    overlay: "linear-gradient(90deg, rgba(235, 246, 221, 0.92), rgba(255, 240, 204, 0.88))",
    textColor: "#24351f",
    borderColor: "rgba(55, 91, 43, 0.3)",
    accentColor: "#4e743e",
  },
  summer: {
    image: "none",
    overlay: "linear-gradient(90deg, rgba(255, 222, 121, 0.9), rgba(243, 177, 67, 0.88))",
    textColor: "#3b2912",
    borderColor: "rgba(111, 70, 15, 0.3)",
    accentColor: "#9a5c0d",
  },
  autumn: {
    image: "none",
    overlay: "linear-gradient(90deg, rgba(221, 157, 77, 0.92), rgba(153, 79, 34, 0.88))",
    textColor: "#24170d",
    borderColor: "rgba(74, 38, 18, 0.38)",
    accentColor: "#7d3519",
  },
  winter: {
    image: "none",
    overlay: "linear-gradient(90deg, rgba(226, 240, 245, 0.94), rgba(189, 215, 226, 0.9))",
    textColor: "#1d3039",
    borderColor: "rgba(43, 78, 94, 0.3)",
    accentColor: "#3d7187",
  },
  romantic: {
    image: "none",
    overlay: "linear-gradient(90deg, rgba(250, 222, 225, 0.94), rgba(224, 169, 178, 0.9))",
    textColor: "#422129",
    borderColor: "rgba(111, 43, 59, 0.3)",
    accentColor: "#9b4058",
  },
  market: {
    image: "none",
    overlay: "linear-gradient(90deg, rgba(241, 218, 164, 0.93), rgba(195, 146, 81, 0.9))",
    textColor: "#342517",
    borderColor: "rgba(91, 60, 28, 0.34)",
    accentColor: "#795126",
  },
  workshop: {
    image: "none",
    overlay: "linear-gradient(90deg, rgba(221, 205, 180, 0.94), rgba(170, 132, 88, 0.9))",
    textColor: "#2f2419",
    borderColor: "rgba(71, 50, 28, 0.34)",
    accentColor: "#694a2b",
  },
  celebration: {
    image: "none",
    overlay: "linear-gradient(90deg, rgba(250, 214, 113, 0.92), rgba(226, 145, 77, 0.9))",
    textColor: "#38200f",
    borderColor: "rgba(105, 54, 17, 0.34)",
    accentColor: "#a24f17",
  },
} satisfies Record<AnnouncementTheme, AnnouncementThemeSettings>;

type AnnouncementThemeProperties = CSSProperties & {
  "--announcement-bg-image": string;
  "--announcement-overlay": string;
  "--announcement-text-color": string;
  "--announcement-border-color": string;
  "--announcement-accent-color": string;
  "--announcement-duration"?: string;
};

function AnnouncementLogo() {
  return (
    <span className="announcementLogo" aria-hidden="true">
      <Image
        src={publicPath("/logo-dekokraft-600.webp")}
        alt=""
        width={34}
        height={34}
      />
    </span>
  );
}

function AnnouncementSequence({
  text,
  lang,
  showLogo,
  duplicate = false,
}: {
  text: string;
  lang: Lang;
  showLogo: boolean;
  duplicate?: boolean;
}) {
  return (
    <span
      className="announcementSequence"
      dir={lang === "ar" ? "rtl" : "ltr"}
      aria-hidden={duplicate || undefined}
    >
      <span className="announcementMessage">{text}</span>
      <span className="announcementGap announcementGapLarge" aria-hidden="true" />
      {showLogo && <AnnouncementLogo />}
      <span className="announcementGap announcementGapLarge" aria-hidden="true" />
    </span>
  );
}

export type DkNotificationBarProps = {
  theme?: AnnouncementTheme;
  variant?: AnnouncementTheme;
  messages?: AnnouncementMessages;
  announcement?: AnnouncementPayload | null;
  lang?: Lang;
  animationRevision?: number;
  direction?: "rtl" | "ltr";
  showLogo?: boolean;
  speed?: AnnouncementSpeed;
};

function readAnnouncementText(
  messages: AnnouncementMessages | null | undefined,
  language: Lang,
) {
  if (!messages) return "";
  if (Array.isArray(messages)) {
    return messages
      .map((message) => message.trim())
      .filter(Boolean)
      .join(" • ");
  }
  return (messages as LocalizedAnnouncementText)[language]?.trim() ?? "";
}

export function DkNotificationBar({
  theme,
  variant = "default",
  messages: customMessages,
  announcement,
  lang: language,
  animationRevision = 0,
  direction,
  showLogo = true,
  speed,
}: DkNotificationBarProps) {
  const { lang: contextLanguage, dictionary } = useLanguage();
  const lang = language ?? contextLanguage;
  const activeTheme = theme ?? variant;
  const activeLanguage: Lang = direction
    ? direction === "rtl"
      ? "ar"
      : lang === "ar"
        ? "en"
        : lang
    : lang;
  const defaultMessages = dictionary.announcement;
  const customText = readAnnouncementText(
    announcement?.messages ?? customMessages,
    activeLanguage,
  );
  const defaultText = readAnnouncementText(defaultMessages, activeLanguage);
  const fallbackText =
    readAnnouncementText(translations.ar.announcement, "ar") ||
    readAnnouncementText(translations.en.announcement, "en") ||
    "";
  const text = customText || defaultText || fallbackText;
  const activeSpeed = speed ?? announcement?.speed ?? "normal";
  const themeSettings = announcementThemes[activeTheme];
  const themeProperties: AnnouncementThemeProperties = {
    "--announcement-bg-image": themeSettings.image,
    "--announcement-overlay": themeSettings.overlay,
    "--announcement-text-color": themeSettings.textColor,
    "--announcement-border-color": themeSettings.borderColor,
    "--announcement-accent-color": themeSettings.accentColor,
    "--announcement-duration": getAnnouncementDuration(activeSpeed),
  };
  const bannerLength =
    announcement?.bannerLength ??
    announcement?.bannerWidth ??
    DEFAULT_BANNER_LENGTH;
  const bannerThickness =
    announcement?.bannerThickness ??
    announcement?.bannerHeight ??
    DEFAULT_BANNER_THICKNESS;

  return (
    <div
      className="publicAnnouncement"
      data-announcement-direction={activeLanguage === "ar" ? "rtl" : "ltr"}
      data-announcement-theme={activeTheme}
      style={{
        ...themeProperties,
        inlineSize: `min(100%, ${bannerLength}px)`,
        blockSize: `${bannerThickness}px`,
        minBlockSize: `${bannerThickness}px`,
        marginInline: "auto",
        overflow: "auto",
        color:
          announcement?.textColor ?? DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
        backgroundColor:
          announcement?.backgroundColor ??
          DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR,
        backgroundImage: announcement?.imageReference
          ? `url(${announcement.imageReference})`
          : undefined,
      }}
      tabIndex={0}
    >
      <div className="announcementViewport">
        <div
          className="announcementTrack"
          key={`main-${activeLanguage}-${animationRevision}`}
        >
          <AnnouncementSequence text={text} lang={activeLanguage} showLogo={showLogo} />
          <AnnouncementSequence text={text} lang={activeLanguage} showLogo={showLogo} duplicate />
        </div>
      </div>
    </div>
  );
}

export default DkNotificationBar;
