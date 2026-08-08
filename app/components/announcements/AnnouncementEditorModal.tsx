"use client";

import "../../admin/admin-v2.css";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FileVideo,
  Globe2,
  ImagePlus,
  Italic,
  Mic,
  Minus,
  PaintBucket,
  Palette,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Lang } from "../../../locales";
import {
  announcementFontSizes as fontSizes,
  BANNER_LENGTH_STEP,
  BANNER_THICKNESS_STEP,
  createDefaultAnnouncementFormatting,
  DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR,
  DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
  DEFAULT_BANNER_LENGTH,
  DEFAULT_BANNER_THICKNESS,
  getNextAnnouncementSpeed,
  MAX_BANNER_LENGTH,
  MAX_BANNER_THICKNESS,
  MIN_BANNER_LENGTH,
  MIN_BANNER_THICKNESS,
  type AnnouncementFormatting,
  type AnnouncementMessages,
  type AnnouncementPayload,
  type AnnouncementSpeed,
  type AnnouncementType,
} from "../../../lib/announcements/types";

export type {
  AnnouncementFormatting,
  AnnouncementMessages,
  AnnouncementPayload,
  AnnouncementType,
} from "../../../lib/announcements/types";

export type AnnouncementEditorModalProps = {
  announcementType: AnnouncementType;
  title: string;
  lang: Lang;
  initialValues: AnnouncementMessages;
  initialFormatting?: Record<Lang, AnnouncementFormatting>;
  initialLanguage?: Lang;
  initialBannerThickness?: number;
  initialBannerLength?: number;
  initialTextColor?: string;
  initialBackgroundColor?: string;
  initialImageReference?: string | null;
  initialLogoSize?: number;
  initialSpeed?: AnnouncementSpeed;
  revision?: string;
  isOpen: boolean;
  currentLogoUrl?: string;
  currentLogoAlt?: string;
  feedback?: string;
  saveLabel?: string;
  onDraftChange?: () => void;
  onCancel: () => void;
  onPreview: (payload: AnnouncementPayload) => void | Promise<void>;
  onSave?: (payload: AnnouncementPayload) => void | Promise<void>;
  onRestoreDefault: () =>
    | AnnouncementPayload
    | void
    | Promise<AnnouncementPayload | void>;
};

const announcementLanguages: Array<{
  code: Lang;
  label: string;
  direction: "rtl" | "ltr";
}> = [
  { code: "ar", label: "العربية", direction: "rtl" },
  { code: "de", label: "Deutsch", direction: "ltr" },
  { code: "en", label: "English", direction: "ltr" },
  { code: "fr", label: "Français", direction: "ltr" },
];

const MIN_LOGO_SIZE = 16;
const MAX_LOGO_SIZE = 96;
const LOGO_SIZE_STEP = 8;
const DEFAULT_LOGO_SIZE = 48;

const modalCopy = {
  ar: {
    label: "نص الإعلان",
    cancel: "إلغاء",
    preview: "معاينة",
    save: "حفظ",
    restoreDefault: "استعادة الافتراضي",
    language: "لغة الإعلان",
    decreaseFontSize: "تصغير الخط",
    increaseFontSize: "تكبير الخط",
    bannerThickness: "عرض الشريط",
    decreaseBannerThickness: "تقليل عرض الشريط",
    increaseBannerThickness: "زيادة عرض الشريط",
    bannerLength: "طول الشريط",
    decreaseBannerLength: "تقليل طول الشريط",
    increaseBannerLength: "زيادة طول الشريط",
    invalidImage: "الملف المختار ليس صورة",
    bold: "خط عريض",
    italic: "خط مائل",
    alignLeft: "محاذاة لليسار",
    alignCenter: "محاذاة للوسط",
    alignRight: "محاذاة لليمين",
    textColor: "لون النص",
    background: "الخلفية",
    uploadImage: "رفع صورة",
    gif: "إضافة GIF",
    video: "إضافة فيديو MP4",
    audio: "إضافة صوت",
    comingSoon: "قريبًا",
    currentLogo: "الشعار الحالي",
    decreaseLogoSize: "تصغير الشعار",
    increaseLogoSize: "تكبير الشعار",
    speed: "السرعة",
    slow: "بطيئة",
    normal: "متوسطة",
    fast: "سريعة",
  },
  de: {
    label: "Ankündigungstext",
    cancel: "Abbrechen",
    preview: "Vorschau",
    save: "Speichern",
    restoreDefault: "Standard wiederherstellen",
    language: "Ankündigungssprache",
    decreaseFontSize: "Schrift verkleinern",
    increaseFontSize: "Schrift vergrößern",
    bannerThickness: "Bannerstärke",
    decreaseBannerThickness: "Bannerstärke verringern",
    increaseBannerThickness: "Bannerstärke vergrößern",
    bannerLength: "Bannerlänge",
    decreaseBannerLength: "Bannerlänge verringern",
    increaseBannerLength: "Bannerlänge vergrößern",
    invalidImage: "Die ausgewählte Datei ist kein Bild",
    bold: "Fett",
    italic: "Kursiv",
    alignLeft: "Linksbündig",
    alignCenter: "Zentriert",
    alignRight: "Rechtsbündig",
    textColor: "Textfarbe",
    background: "Hintergrund",
    uploadImage: "Bild hochladen",
    gif: "GIF hinzufügen",
    video: "MP4-Video hinzufügen",
    audio: "Audio hinzufügen",
    comingSoon: "Demnächst",
    currentLogo: "Aktuelles Logo",
    decreaseLogoSize: "Logo verkleinern",
    increaseLogoSize: "Logo vergrößern",
    speed: "Geschwindigkeit",
    slow: "Langsam",
    normal: "Mittel",
    fast: "Schnell",
  },
  en: {
    label: "Announcement text",
    cancel: "Cancel",
    preview: "Preview",
    save: "Save",
    restoreDefault: "Restore default",
    language: "Announcement language",
    decreaseFontSize: "Decrease font size",
    increaseFontSize: "Increase font size",
    bannerThickness: "Banner Thickness",
    decreaseBannerThickness: "Decrease banner thickness",
    increaseBannerThickness: "Increase banner thickness",
    bannerLength: "Banner Length",
    decreaseBannerLength: "Decrease banner length",
    increaseBannerLength: "Increase banner length",
    invalidImage: "Selected file is not an image",
    bold: "Bold",
    italic: "Italic",
    alignLeft: "Align left",
    alignCenter: "Align center",
    alignRight: "Align right",
    textColor: "Text color",
    background: "Background",
    uploadImage: "Upload image",
    gif: "Add GIF",
    video: "Add MP4 video",
    audio: "Add audio",
    comingSoon: "Coming soon",
    currentLogo: "Current logo",
    decreaseLogoSize: "Reduce logo size",
    increaseLogoSize: "Increase logo size",
    speed: "Speed",
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
  },
  fr: {
    label: "Texte de l’annonce",
    cancel: "Annuler",
    preview: "Aperçu",
    save: "Enregistrer",
    restoreDefault: "Restaurer par défaut",
    language: "Langue de l’annonce",
    decreaseFontSize: "Réduire la police",
    increaseFontSize: "Agrandir la police",
    bannerThickness: "Épaisseur de la bannière",
    decreaseBannerThickness: "Réduire l’épaisseur de la bannière",
    increaseBannerThickness: "Augmenter l’épaisseur de la bannière",
    bannerLength: "Longueur de la bannière",
    decreaseBannerLength: "Réduire la longueur de la bannière",
    increaseBannerLength: "Augmenter la longueur de la bannière",
    invalidImage: "Le fichier sélectionné n’est pas une image",
    bold: "Gras",
    italic: "Italique",
    alignLeft: "Aligner à gauche",
    alignCenter: "Centrer",
    alignRight: "Aligner à droite",
    textColor: "Couleur du texte",
    background: "Arrière-plan",
    uploadImage: "Importer une image",
    gif: "Ajouter un GIF",
    video: "Ajouter une vidéo MP4",
    audio: "Ajouter un audio",
    comingSoon: "Bientôt disponible",
    currentLogo: "Logo actuel",
    decreaseLogoSize: "Réduire le logo",
    increaseLogoSize: "Agrandir le logo",
    speed: "Vitesse",
    slow: "Lente",
    normal: "Normale",
    fast: "Rapide",
  },
} as const;

export default function AnnouncementEditorModal({
  announcementType,
  title,
  lang,
  initialValues,
  initialFormatting,
  initialLanguage,
  initialBannerThickness = DEFAULT_BANNER_THICKNESS,
  initialBannerLength = DEFAULT_BANNER_LENGTH,
  initialTextColor = DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
  initialBackgroundColor = DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR,
  initialImageReference = null,
  initialLogoSize = DEFAULT_LOGO_SIZE,
  initialSpeed = "normal",
  revision,
  isOpen,
  currentLogoUrl,
  currentLogoAlt,
  feedback,
  saveLabel,
  onDraftChange,
  onCancel,
  onPreview,
  onSave,
  onRestoreDefault,
}: AnnouncementEditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<AnnouncementMessages>({ ...initialValues });
  const [activeLanguage, setActiveLanguage] = useState<Lang>(initialLanguage ?? lang);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [logoSize, setLogoSize] = useState(() =>
    Math.min(MAX_LOGO_SIZE, Math.max(MIN_LOGO_SIZE, initialLogoSize)),
  );
  const [bannerLength, setBannerLength] = useState(() =>
    Math.min(
      MAX_BANNER_LENGTH,
      Math.max(MIN_BANNER_LENGTH, initialBannerLength),
    ),
  );
  const [bannerThickness, setBannerThickness] = useState(() =>
    Math.min(
      MAX_BANNER_THICKNESS,
      Math.max(MIN_BANNER_THICKNESS, initialBannerThickness),
    ),
  );
  const [textColor, setTextColor] = useState(initialTextColor);
  const [backgroundColor, setBackgroundColor] =
    useState(initialBackgroundColor);
  const [imageReference, setImageReference] =
    useState<string | null>(initialImageReference);
  const [mediaFeedback, setMediaFeedback] = useState("");
  const [speed, setSpeed] = useState<AnnouncementSpeed>(initialSpeed);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [formatting, setFormatting] = useState(
    () => initialFormatting ?? createDefaultAnnouncementFormatting(),
  );
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const backgroundColorInputRef = useRef<HTMLInputElement>(null);
  const initializedRevisionRef = useRef<string | null>(null);
  const copy = modalCopy[lang];
  const direction = lang === "ar" ? "rtl" : "ltr";
  const activeLanguageOption =
    announcementLanguages.find((language) => language.code === activeLanguage) ??
    announcementLanguages[0];
  const activeFormatting = formatting[activeLanguage];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      initializedRevisionRef.current = null;
      return;
    }
    const nextRevision = revision ?? "open";
    if (initializedRevisionRef.current === nextRevision) return;
    initializedRevisionRef.current = nextRevision;
    setDraft({ ...initialValues });
    setFormatting(
      initialFormatting ?? createDefaultAnnouncementFormatting(),
    );
    setActiveLanguage(initialLanguage ?? lang);
    setBannerLength(
      Math.min(
        MAX_BANNER_LENGTH,
        Math.max(MIN_BANNER_LENGTH, initialBannerLength),
      ),
    );
    setBannerThickness(
      Math.min(
        MAX_BANNER_THICKNESS,
        Math.max(MIN_BANNER_THICKNESS, initialBannerThickness),
      ),
    );
    setTextColor(initialTextColor);
    setBackgroundColor(initialBackgroundColor);
    setImageReference(initialImageReference);
    setMediaFeedback("");
    setLogoSize(
      Math.min(MAX_LOGO_SIZE, Math.max(MIN_LOGO_SIZE, initialLogoSize)),
    );
    setSpeed(initialSpeed);
  }, [
    initialBackgroundColor,
    initialBannerLength,
    initialBannerThickness,
    initialFormatting,
    initialImageReference,
    initialLanguage,
    initialLogoSize,
    initialSpeed,
    initialTextColor,
    initialValues,
    isOpen,
    lang,
    revision,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    onDraftChange?.();
  }, [
    activeLanguage,
    backgroundColor,
    bannerLength,
    bannerThickness,
    draft,
    formatting,
    imageReference,
    isOpen,
    logoSize,
    onDraftChange,
    speed,
    textColor,
  ]);

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isLanguageMenuOpen) {
        setIsLanguageMenuOpen(false);
        return;
      }
      onCancel();
    };

    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [isLanguageMenuOpen, onCancel]);

  useEffect(() => {
    const closeLanguageMenu = (event: PointerEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeLanguageMenu);
    return () => document.removeEventListener("pointerdown", closeLanguageMenu);
  }, []);

  function updateFormatting(next: Partial<AnnouncementFormatting>) {
    setFormatting((current) => ({
      ...current,
      [activeLanguage]: {
        ...current[activeLanguage],
        ...next,
      },
    }));
  }

  function changeFontSize(direction: -1 | 1) {
    const currentIndex = fontSizes.indexOf(activeFormatting.fontSize);
    const nextIndex = Math.min(
      fontSizes.length - 1,
      Math.max(0, currentIndex + direction),
    );
    updateFormatting({ fontSize: fontSizes[nextIndex] });
  }

  function decreaseLogoSize() {
    setLogoSize((current) =>
      Math.max(MIN_LOGO_SIZE, current - LOGO_SIZE_STEP),
    );
  }

  function increaseLogoSize() {
    setLogoSize((current) =>
      Math.min(MAX_LOGO_SIZE, current + LOGO_SIZE_STEP),
    );
  }

  function changeBannerLength(direction: -1 | 1) {
    setBannerLength((current) =>
      Math.min(
        MAX_BANNER_LENGTH,
        Math.max(
          MIN_BANNER_LENGTH,
          current + direction * BANNER_LENGTH_STEP,
        ),
      ),
    );
  }

  function changeBannerThickness(direction: -1 | 1) {
    setBannerThickness((current) =>
      Math.min(
        MAX_BANNER_THICKNESS,
        Math.max(
          MIN_BANNER_THICKNESS,
          current + direction * BANNER_THICKNESS_STEP,
        ),
      ),
    );
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMediaFeedback(copy.invalidImage);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setImageReference(reader.result);
      setMediaFeedback("");
    };
    reader.onerror = () => setMediaFeedback(copy.invalidImage);
    reader.readAsDataURL(file);
  }

  function createDraftPayload(): AnnouncementPayload {
    return {
      messages: { ...draft },
      formatting,
      language: activeLanguage,
      bannerThickness,
      bannerLength,
      textColor,
      backgroundColor,
      imageReference,
      logoReference: currentLogoUrl ?? null,
      logoSize,
      speed,
    };
  }

  async function previewDraft() {
    setIsPreviewing(true);
    try {
      await onPreview(createDraftPayload());
    } finally {
      setIsPreviewing(false);
    }
  }

  async function saveDraft() {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(createDraftPayload());
    } finally {
      setIsSaving(false);
    }
  }

  async function restoreDraft() {
    setIsRestoring(true);
    try {
      const restored = await onRestoreDefault();
      if (!restored) return;
      setDraft({ ...restored.messages });
      setFormatting(restored.formatting);
      setActiveLanguage(restored.language ?? lang);
      setBannerLength(
        restored.bannerLength ??
          restored.bannerWidth ??
          DEFAULT_BANNER_LENGTH,
      );
      setBannerThickness(
        restored.bannerThickness ??
          restored.bannerHeight ??
          DEFAULT_BANNER_THICKNESS,
      );
      setTextColor(restored.textColor ?? DEFAULT_ANNOUNCEMENT_TEXT_COLOR);
      setBackgroundColor(
        restored.backgroundColor ?? DEFAULT_ANNOUNCEMENT_BACKGROUND_COLOR,
      );
      setImageReference(restored.imageReference ?? null);
      setLogoSize(restored.logoSize ?? DEFAULT_LOGO_SIZE);
      setSpeed(restored.speed ?? "normal");
    } finally {
      setIsRestoring(false);
    }
  }

  function placeholderButton(
    label: string,
    icon: React.ReactNode,
    extraClassName = "",
  ) {
    return (
      <button
        type="button"
        className={`adminAnnouncementFormatButton is-placeholder${extraClassName ? ` ${extraClassName}` : ""}`}
        aria-label={`${label} — ${copy.comingSoon}`}
        title={`${label} — ${copy.comingSoon}`}
        aria-disabled="true"
        disabled
      >
        {icon}
      </button>
    );
  }

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="adminAnnouncementModalBackdrop participantAnnouncementOverlay dkPublicTheme"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className={`adminAnnouncementModal participantAnnouncementDialog${
          announcementType === "participant"
            ? " participantAnnouncementModal"
            : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${announcementType}-announcement-modal-title`}
        data-announcement-type={announcementType}
        dir={direction}
      >
        <div className="adminAnnouncementModalHeader">
          <h2 id={`${announcementType}-announcement-modal-title`}>{title}</h2>
          <div className="adminAnnouncementLanguageSelector" ref={languageMenuRef}>
            <button
              type="button"
              className="adminAnnouncementLanguageButton"
              aria-label={copy.language}
              title={copy.language}
              aria-haspopup="menu"
              aria-expanded={isLanguageMenuOpen}
              onClick={() => setIsLanguageMenuOpen((open) => !open)}
            >
              <Globe2 aria-hidden="true" />
              <span>{activeLanguage.toUpperCase()}</span>
            </button>
            {isLanguageMenuOpen && (
              <div className="adminAnnouncementLanguageMenu" role="menu">
                {announcementLanguages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={language.code === activeLanguage}
                    dir={language.direction}
                    onClick={() => {
                      setActiveLanguage(language.code);
                      setIsLanguageMenuOpen(false);
                      requestAnimationFrame(() => textareaRef.current?.focus());
                    }}
                  >
                    <span>{language.label}</span>
                    <span>{language.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {announcementType === "participant" && currentLogoUrl && (
          <div className="adminAnnouncementCurrentLogo participantAnnouncementCurrentLogo">
            <span>{copy.currentLogo}</span>
            <Image
              src={currentLogoUrl}
              alt={currentLogoAlt || copy.currentLogo}
              width={logoSize}
              height={logoSize}
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
                objectFit: "contain",
              }}
              unoptimized
            />
            <div
              className="participantAnnouncementLogoSizeControls"
              role="group"
              aria-label={copy.currentLogo}
            >
              <button
                type="button"
                aria-label={copy.decreaseLogoSize}
                title={copy.decreaseLogoSize}
                disabled={logoSize <= MIN_LOGO_SIZE}
                onClick={decreaseLogoSize}
              >
                <Minus aria-hidden="true" />
              </button>
              <output aria-live="polite">{logoSize}px</output>
              <button
                type="button"
                aria-label={copy.increaseLogoSize}
                title={copy.increaseLogoSize}
                disabled={logoSize >= MAX_LOGO_SIZE}
                onClick={increaseLogoSize}
              >
                <Plus aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        <div
          className="adminAnnouncementModalFields announcementPreviewWrapper"
          style={{
            inlineSize: `min(100%, ${bannerLength}px)`,
            blockSize: `${bannerThickness}px`,
            maxBlockSize: "none",
            marginInline: "auto",
            overflow: "auto",
            color: textColor,
            backgroundColor,
            backgroundImage: imageReference
              ? `url(${JSON.stringify(imageReference).slice(1, -1)})`
              : undefined,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          <label htmlFor={`${announcementType}-announcement-${activeLanguage}`}>
            <span>{activeLanguageOption.label}</span>
            <textarea
              ref={textareaRef}
              className={
                announcementType === "participant"
                  ? "participantAnnouncementEditor"
                  : undefined
              }
              id={`${announcementType}-announcement-${activeLanguage}`}
              value={draft[activeLanguage]}
              dir={activeLanguageOption.direction}
              aria-label={`${copy.label} — ${activeLanguageOption.label}`}
              style={{
                blockSize: "100%",
                color: "inherit",
                background: "transparent",
                fontSize: `${activeFormatting.fontSize}px`,
                fontWeight: activeFormatting.bold ? 700 : 400,
                fontStyle: activeFormatting.italic ? "italic" : "normal",
                textAlign: activeFormatting.alignment,
              }}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((current) => ({
                  ...current,
                  [activeLanguage]: value,
                }));
              }}
              autoFocus
            />
          </label>
        </div>
        <div className="announcementDimensionControls">
          <div
            className="announcementDimensionControl"
            role="group"
            aria-label={copy.bannerThickness}
          >
            <span>{copy.bannerThickness}</span>
            <button
              type="button"
              aria-label={copy.decreaseBannerThickness}
              title={copy.decreaseBannerThickness}
              disabled={bannerThickness <= MIN_BANNER_THICKNESS}
              onClick={() => changeBannerThickness(-1)}
            >
              <Minus aria-hidden="true" />
            </button>
            <output aria-live="polite">
              {Math.round(bannerThickness / BANNER_THICKNESS_STEP)}
              {lang === "ar" ? " سم" : " cm"}
            </output>
            <button
              type="button"
              aria-label={copy.increaseBannerThickness}
              title={copy.increaseBannerThickness}
              disabled={bannerThickness >= MAX_BANNER_THICKNESS}
              onClick={() => changeBannerThickness(1)}
            >
              <Plus aria-hidden="true" />
            </button>
          </div>
          <div
            className="announcementDimensionControl"
            role="group"
            aria-label={copy.bannerLength}
          >
            <span>{copy.bannerLength}</span>
            <button
              type="button"
              aria-label={copy.decreaseBannerLength}
              title={copy.decreaseBannerLength}
              disabled={bannerLength <= MIN_BANNER_LENGTH}
              onClick={() => changeBannerLength(-1)}
            >
              <Minus aria-hidden="true" />
            </button>
            <output aria-live="polite">{bannerLength}px</output>
            <button
              type="button"
              aria-label={copy.increaseBannerLength}
              title={copy.increaseBannerLength}
              disabled={bannerLength >= MAX_BANNER_LENGTH}
              onClick={() => changeBannerLength(1)}
            >
              <Plus aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          className={`adminAnnouncementFormattingToolbar${
            announcementType === "participant"
              ? " participantEditorToolbar"
              : ""
          }`}
          role="toolbar"
          aria-label={copy.label}
        >
          <div className="adminAnnouncementFormattingGroup">
            <button
              type="button"
              className="adminAnnouncementFormatButton"
              aria-label={copy.decreaseFontSize}
              title={copy.decreaseFontSize}
              disabled={activeFormatting.fontSize === fontSizes[0]}
              onClick={() => changeFontSize(-1)}
            >
              <Minus aria-hidden="true" />
            </button>
            <output className="adminAnnouncementFontSize" aria-live="polite">
              {activeFormatting.fontSize}px
            </output>
            <button
              type="button"
              className="adminAnnouncementFormatButton"
              aria-label={copy.increaseFontSize}
              title={copy.increaseFontSize}
              disabled={activeFormatting.fontSize === fontSizes[fontSizes.length - 1]}
              onClick={() => changeFontSize(1)}
            >
              <Plus aria-hidden="true" />
            </button>
          </div>
          <div className="adminAnnouncementFormattingGroup">
            <button
              type="button"
              className="adminAnnouncementFormatButton"
              aria-label={copy.bold}
              title={copy.bold}
              aria-pressed={activeFormatting.bold}
              onClick={() => updateFormatting({ bold: !activeFormatting.bold })}
            >
              <Bold aria-hidden="true" />
            </button>
            <button
              type="button"
              className="adminAnnouncementFormatButton"
              aria-label={copy.italic}
              title={copy.italic}
              aria-pressed={activeFormatting.italic}
              onClick={() => updateFormatting({ italic: !activeFormatting.italic })}
            >
              <Italic aria-hidden="true" />
            </button>
          </div>
          <div className="adminAnnouncementFormattingGroup">
            {([
              [
                activeLanguageOption.direction === "rtl" ? "right" : "left",
                activeLanguageOption.direction === "rtl"
                  ? copy.alignRight
                  : copy.alignLeft,
                activeLanguageOption.direction === "rtl"
                  ? <AlignRight key="start" aria-hidden="true" />
                  : <AlignLeft key="start" aria-hidden="true" />,
              ],
              ["center", copy.alignCenter, <AlignCenter key="center" aria-hidden="true" />],
              [
                activeLanguageOption.direction === "rtl" ? "left" : "right",
                activeLanguageOption.direction === "rtl"
                  ? copy.alignLeft
                  : copy.alignRight,
                activeLanguageOption.direction === "rtl"
                  ? <AlignLeft key="end" aria-hidden="true" />
                  : <AlignRight key="end" aria-hidden="true" />,
              ],
            ] as const).map(([alignment, label, icon]) => (
              <button
                key={alignment}
                type="button"
                className="adminAnnouncementFormatButton"
                aria-label={label}
                title={label}
                aria-pressed={activeFormatting.alignment === alignment}
                onClick={() => updateFormatting({ alignment })}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="adminAnnouncementFormattingGroup">
            <button
              type="button"
              className="adminAnnouncementFormatButton"
              aria-label={copy.textColor}
              title={copy.textColor}
              onClick={() => textColorInputRef.current?.click()}
            >
              <Palette aria-hidden="true" />
            </button>
            <input
              ref={textColorInputRef}
              type="color"
              value={textColor}
              aria-label={copy.textColor}
              className="announcementHiddenInput"
              onChange={(event) => setTextColor(event.target.value)}
            />
            <button
              type="button"
              className="adminAnnouncementFormatButton"
              aria-label={copy.background}
              title={copy.background}
              onClick={() => backgroundColorInputRef.current?.click()}
            >
              <PaintBucket aria-hidden="true" />
            </button>
            <input
              ref={backgroundColorInputRef}
              type="color"
              value={backgroundColor}
              aria-label={copy.background}
              className="announcementHiddenInput"
              onChange={(event) => setBackgroundColor(event.target.value)}
            />
            <button
              type="button"
              className="adminAnnouncementFormatButton"
              aria-label={copy.uploadImage}
              title={copy.uploadImage}
              onClick={() => imageInputRef.current?.click()}
            >
              <ImagePlus aria-hidden="true" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              aria-label={copy.uploadImage}
              className="announcementHiddenInput"
              onChange={handleImageChange}
            />
            {placeholderButton(copy.gif, <span aria-hidden="true">GIF</span>, "adminAnnouncementGifButton")}
            {placeholderButton(copy.video, <FileVideo aria-hidden="true" />)}
            {placeholderButton(copy.audio, <Mic aria-hidden="true" />)}
          </div>
          <div className="adminAnnouncementFormattingGroup">
            <button
              type="button"
              className="announcementSpeedButton"
              onClick={() => setSpeed((current) => getNextAnnouncementSpeed(current))}
            >
              {copy.speed}: {copy[speed]}
            </button>
          </div>
        </div>
        {(feedback || mediaFeedback) && (
          <p className="adminAnnouncementModalFeedback" role="status">
            {mediaFeedback || feedback}
          </p>
        )}
        <div className="adminAnnouncementModalActions">
          <button
            type="button"
            disabled={isRestoring}
            onClick={() => void restoreDraft()}
          >
            {copy.restoreDefault}
          </button>
          <button type="button" onClick={onCancel}>
            {copy.cancel}
          </button>
          <button
            type="button"
            className="adminAnnouncementModalPreview"
            disabled={isPreviewing}
            onClick={() => void previewDraft()}
          >
            {copy.preview}
          </button>
          {onSave && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveDraft()}
            >
              {saveLabel ?? copy.save}
            </button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
