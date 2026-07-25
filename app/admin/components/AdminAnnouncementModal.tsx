"use client";

import { useEffect, useState } from "react";
import type { Lang } from "../../../locales";

export type AnnouncementMessages = Record<Lang, string>;

type AdminAnnouncementModalProps = {
  lang: Lang;
  messages: AnnouncementMessages;
  onCancel: () => void;
  onPreview: (messages: AnnouncementMessages) => void;
  onRestoreDefault: () => void;
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

const modalCopy = {
  ar: {
    title: "تعديل الإعلان",
    label: "نص الإعلان",
    cancel: "إلغاء",
    preview: "معاينة",
    restoreDefault: "استعادة الافتراضي",
  },
  de: {
    title: "Ankündigung bearbeiten",
    label: "Ankündigungstext",
    cancel: "Abbrechen",
    preview: "Vorschau",
    restoreDefault: "Standard wiederherstellen",
  },
  en: {
    title: "Edit announcement",
    label: "Announcement text",
    cancel: "Cancel",
    preview: "Preview",
    restoreDefault: "Restore default",
  },
  fr: {
    title: "Modifier l’annonce",
    label: "Texte de l’annonce",
    cancel: "Annuler",
    preview: "Aperçu",
    restoreDefault: "Restaurer par défaut",
  },
} as const;

export default function AdminAnnouncementModal({
  lang,
  messages,
  onCancel,
  onPreview,
  onRestoreDefault,
}: AdminAnnouncementModalProps) {
  const [draft, setDraft] = useState<AnnouncementMessages>({ ...messages });
  const copy = modalCopy[lang];
  const direction = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [onCancel]);

  return (
    <div
      className="adminAnnouncementModalBackdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="adminAnnouncementModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-announcement-modal-title"
        dir={direction}
      >
        <h2 id="admin-announcement-modal-title">{copy.title}</h2>
        <div className="adminAnnouncementModalFields">
          {announcementLanguages.map((language, index) => (
            <label key={language.code} htmlFor={`admin-announcement-${language.code}`}>
              <span>{language.label}</span>
              <textarea
                id={`admin-announcement-${language.code}`}
                value={draft[language.code]}
                dir={language.direction}
                aria-label={`${copy.label} — ${language.label}`}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft((current) => ({
                    ...current,
                    [language.code]: value,
                  }));
                }}
                autoFocus={index === 0}
              />
            </label>
          ))}
        </div>
        <div className="adminAnnouncementModalActions">
          <button type="button" onClick={onRestoreDefault}>
            {copy.restoreDefault}
          </button>
          <button type="button" onClick={onCancel}>
            {copy.cancel}
          </button>
          <button
            type="button"
            className="adminAnnouncementModalPreview"
            onClick={() => onPreview({ ...draft })}
          >
            {copy.preview}
          </button>
        </div>
      </section>
    </div>
  );
}
