import type { Lang } from "../../locales";
import {
  announcementFontSizes,
  BANNER_LENGTH_STEP,
  BANNER_THICKNESS_STEP,
  DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR,
  DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
  DEFAULT_BANNER_LENGTH,
  DEFAULT_BANNER_THICKNESS,
  MAX_BANNER_LENGTH,
  MAX_BANNER_THICKNESS,
  MIN_BANNER_LENGTH,
  MIN_BANNER_THICKNESS,
  createDefaultAnnouncementFormatting,
  type AnnouncementFormatting,
  type AnnouncementPayload,
} from "./types.ts";

const languages: Lang[] = ["ar", "de", "en", "fr"];

function parseLogoReference(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 2_000_000) {
    throw new Error("INVALID_ANNOUNCEMENT");
  }
  if (
    !value.startsWith("/") &&
    !value.startsWith("https://") &&
    !value.startsWith("http://") &&
    !value.startsWith("data:image/")
  ) {
    throw new Error("INVALID_ANNOUNCEMENT");
  }
  return value;
}

function parseColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : fallback;
}

export function parseAnnouncementPayload(value: unknown): AnnouncementPayload {
  if (!value || typeof value !== "object") throw new Error("INVALID_ANNOUNCEMENT");
  const record = value as Record<string, unknown>;
  const messagesValue = record.messages;
  const formattingValue = record.formatting;
  if (!messagesValue || typeof messagesValue !== "object") throw new Error("INVALID_ANNOUNCEMENT");
  const messagesRecord = messagesValue as Record<string, unknown>;
  const formattingRecord =
    formattingValue && typeof formattingValue === "object"
      ? formattingValue as Record<string, unknown>
      : {};
  const defaults = createDefaultAnnouncementFormatting();

  const messages = Object.fromEntries(
    languages.map((language) => {
      const text = messagesRecord[language];
      if (typeof text !== "string") throw new Error("INVALID_ANNOUNCEMENT");
      return [language, text.slice(0, 4000)];
    }),
  ) as AnnouncementPayload["messages"];

  const formatting = Object.fromEntries(
    languages.map((language) => {
      const candidate = formattingRecord[language];
      if (!candidate || typeof candidate !== "object") return [language, defaults[language]];
      const item = candidate as Partial<Record<keyof AnnouncementFormatting, unknown>>;
      const fontSize = typeof item.fontSize === "number" &&
        announcementFontSizes.includes(item.fontSize as AnnouncementFormatting["fontSize"])
        ? item.fontSize as AnnouncementFormatting["fontSize"]
        : defaults[language].fontSize;
      const alignment = item.alignment === "left" || item.alignment === "center" || item.alignment === "right"
        ? item.alignment
        : defaults[language].alignment;
      return [language, {
        fontSize,
        bold: item.bold === true,
        italic: item.italic === true,
        alignment,
      }];
    }),
  ) as AnnouncementPayload["formatting"];

  const language = languages.includes(record.language as Lang)
    ? record.language as Lang
    : undefined;
  const logoReference = parseLogoReference(record.logoReference);
  const rawBannerThickness = record.bannerThickness ?? record.bannerHeight;
  const bannerThickness =
    typeof rawBannerThickness === "number" &&
    Number.isFinite(rawBannerThickness) &&
    rawBannerThickness >= MIN_BANNER_THICKNESS &&
    rawBannerThickness <= MAX_BANNER_THICKNESS
      ? Math.round(rawBannerThickness / BANNER_THICKNESS_STEP) *
        BANNER_THICKNESS_STEP
      : DEFAULT_BANNER_THICKNESS;
  const rawBannerLength = record.bannerLength ?? record.bannerWidth;
  const bannerLength =
    typeof rawBannerLength === "number" &&
    Number.isFinite(rawBannerLength) &&
    rawBannerLength >= MIN_BANNER_LENGTH &&
    rawBannerLength <= MAX_BANNER_LENGTH
      ? Math.round(rawBannerLength / BANNER_LENGTH_STEP) * BANNER_LENGTH_STEP
      : DEFAULT_BANNER_LENGTH;
  const textColor = parseColor(
    record.textColor,
    DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
  );
  const backgroundColor = parseColor(
    record.backgroundColor,
    DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR,
  );
  const imageReference = parseLogoReference(record.imageReference);
  const logoSize =
    typeof record.logoSize === "number" &&
    Number.isFinite(record.logoSize) &&
    record.logoSize >= 16 &&
    record.logoSize <= 96
      ? Math.round(record.logoSize / 8) * 8
      : 48;
  const speed =
    record.speed === "slow" ||
    record.speed === "normal" ||
    record.speed === "fast"
      ? record.speed
      : "normal";

  return {
    messages,
    formatting,
    language,
    bannerThickness,
    bannerLength,
    textColor,
    backgroundColor,
    imageReference,
    logoReference,
    logoSize,
    speed,
  };
}
