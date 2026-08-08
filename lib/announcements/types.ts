import type { Lang } from "../../locales";

export type AnnouncementType = "main" | "participant";
export type AnnouncementSpeed = "slow" | "normal" | "fast";
export type AnnouncementStatus = "active" | "hidden_by_admin" | "stopped";
export type AnnouncementMessages = Record<Lang, string>;
export type AnnouncementTextAlignment = "left" | "center" | "right";
export type AnnouncementFontSize = 9 | 11 | 12 | 14 | 16 | 18 | 20 | 24 | 28 | 32;

export type AnnouncementFormatting = {
  fontSize: AnnouncementFontSize;
  bold: boolean;
  italic: boolean;
  alignment: AnnouncementTextAlignment;
};

export type AnnouncementPayload = {
  messages: AnnouncementMessages;
  formatting: Record<Lang, AnnouncementFormatting>;
  language?: Lang;
  bannerThickness?: number;
  bannerLength?: number;
  textColor?: string;
  backgroundColor?: string;
  imageReference?: string | null;
  /** Legacy horizontal dimension. */
  bannerWidth?: number;
  /** Legacy vertical dimension. */
  bannerHeight?: number;
  logoReference?: string | null;
  logoSize?: number;
  speed?: AnnouncementSpeed;
};

export const MIN_BANNER_LENGTH = 320;
export const MAX_BANNER_LENGTH = 960;
export const BANNER_LENGTH_STEP = 40;
export const DEFAULT_BANNER_LENGTH = 760;
export const MIN_BANNER_THICKNESS = 38;
export const MAX_BANNER_THICKNESS = 190;
export const BANNER_THICKNESS_STEP = 38;
export const DEFAULT_BANNER_THICKNESS = 76;
export const DEFAULT_ANNOUNCEMENT_TEXT_COLOR = "#10213d";
export const DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR = "#e6efff";

export function getNextAnnouncementSpeed(
  current: AnnouncementSpeed,
): AnnouncementSpeed {
  if (current === "slow") return "normal";
  if (current === "normal") return "fast";
  return "slow";
}

export function getAnnouncementDuration(speed: AnnouncementSpeed) {
  if (speed === "slow") return "42s";
  if (speed === "fast") return "16s";
  return "28s";
}

export const announcementFontSizes: readonly AnnouncementFontSize[] =
  [9, 11, 12, 14, 16, 18, 20, 24, 28, 32];

export function createDefaultAnnouncementFormatting(): Record<Lang, AnnouncementFormatting> {
  return {
    ar: { fontSize: 14, bold: false, italic: false, alignment: "right" },
    de: { fontSize: 14, bold: false, italic: false, alignment: "left" },
    en: { fontSize: 14, bold: false, italic: false, alignment: "left" },
    fr: { fontSize: 14, bold: false, italic: false, alignment: "left" },
  };
}

export function createAnnouncementPayload(messages: AnnouncementMessages): AnnouncementPayload {
  return {
    messages,
    formatting: createDefaultAnnouncementFormatting(),
    bannerThickness: DEFAULT_BANNER_THICKNESS,
    bannerLength: DEFAULT_BANNER_LENGTH,
    textColor: DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
    backgroundColor: DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR,
    imageReference: null,
    speed: "normal",
  };
}
