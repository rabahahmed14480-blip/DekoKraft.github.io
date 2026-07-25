import { ar } from "./ar.ts";
import { de } from "./de.ts";
import { en } from "./en.ts";
import { fr } from "./fr.ts";
import {
  type LanguageOption,
  type Lang,
  type LocaleMessages,
  type LocalizedValue,
  type TranslationParams,
} from "./types.ts";

export type {
  Direction,
  LanguageOption,
  Lang,
  LocaleMessages,
  LocalizedValue,
  TranslationParams,
} from "./types.ts";

export const languageStorageKey = "dekokraft-lang";
export const defaultLanguage: Lang = "ar";

export const languageOptions: LanguageOption[] = [
  { value: "ar", code: "AR", label: "العربية" },
  { value: "de", code: "DE", label: "Deutsch" },
  { value: "en", code: "EN", label: "English" },
  { value: "fr", code: "FR", label: "Français" },
];

export const translations: Record<Lang, LocaleMessages> = {
  ar,
  de,
  en,
  fr,
};

export function isLang(value: string | null): value is Lang {
  return value === "ar" || value === "de" || value === "en" || value === "fr";
}

export function safeLang(value: unknown, fallback: Lang = defaultLanguage): Lang {
  return typeof value === "string" && isLang(value) ? value : fallback;
}

export function getTextDirection(lang: Lang) {
  return translations[lang].dir;
}

export function getStoredLanguage(): Lang {
  if (typeof window === "undefined") {
    return "ar";
  }

  try {
    return safeLang(localStorage.getItem(languageStorageKey));
  } catch {
    return defaultLanguage;
  }
}

function readPath(source: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
}

function interpolate(value: string, params?: TranslationParams) {
  if (!params) return value;
  return value.replace(/\{([^{}]+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

export type Translator = ((
  key: string,
  params?: TranslationParams,
  fallback?: string
) => string) & LocaleMessages;

export function createTranslator(lang: Lang): Translator {
  const dictionary = translations[lang];
  const fallbackDictionary = translations[defaultLanguage];
  const translate = (key: string, params?: TranslationParams, fallback?: string) => {
    const localized = readPath(dictionary, key);
    const defaultValue = readPath(fallbackDictionary, key);
    const value =
      typeof localized === "string"
        ? localized
        : typeof defaultValue === "string"
          ? defaultValue
          : fallback ?? key;
    return interpolate(value, params);
  };

  return Object.assign(translate, dictionary) as Translator;
}

export function getLocalizedValue<T>(
  value: LocalizedValue<T>,
  lang: Lang,
  fallback: Lang = defaultLanguage
): T | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value as T;
  const localized = value as Partial<Record<Lang, T>>;
  return localized[lang] ?? localized[fallback] ?? Object.values(localized)[0];
}
