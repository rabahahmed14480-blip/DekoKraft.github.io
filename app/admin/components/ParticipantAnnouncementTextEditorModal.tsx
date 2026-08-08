"use client";

import type { Lang } from "../../../locales";
import AnnouncementEditorModal from "../../components/announcements/AnnouncementEditorModal";
import {
  createAnnouncementPayload,
  type AnnouncementMessages,
  type AnnouncementPayload,
} from "../../../lib/announcements/types";

type ParticipantAnnouncementTextEditorModalProps = {
  lang: Lang;
  draft: AnnouncementPayload;
  onCancel: () => void;
  onPreview: (draft: AnnouncementPayload) => void;
  onContinue: (draft: AnnouncementPayload) => void;
};

const defaultMessages: AnnouncementMessages = {
  ar: "مرحبًا بكم في إعلان المشارك",
  de: "Willkommen bei der Teilnehmeranzeige",
  en: "Welcome to the participant announcement",
  fr: "Bienvenue dans l’annonce du participant",
};

const copy = {
  ar: { title: "كتابة إعلان المشاركين", continue: "حفظ ومتابعة" },
  de: { title: "Teilnehmeranzeige schreiben", continue: "Speichern und weiter" },
  en: { title: "Write participant announcement", continue: "Save and continue" },
  fr: { title: "Rédiger l’annonce des participants", continue: "Enregistrer et continuer" },
} as const;

export default function ParticipantAnnouncementTextEditorModal({
  lang,
  draft,
  onCancel,
  onPreview,
  onContinue,
}: ParticipantAnnouncementTextEditorModalProps) {
  const text = copy[lang];

  return (
    <AnnouncementEditorModal
      announcementType="participant"
      title={text.title}
      lang={lang}
      initialValues={draft.messages}
      initialFormatting={draft.formatting}
      initialLanguage={draft.language ?? lang}
      initialBannerThickness={
        draft.bannerThickness ?? draft.bannerHeight
      }
      initialBannerLength={draft.bannerLength ?? draft.bannerWidth}
      initialTextColor={draft.textColor}
      initialBackgroundColor={draft.backgroundColor}
      initialImageReference={draft.imageReference}
      initialLogoSize={draft.logoSize ?? 48}
      initialSpeed={draft.speed ?? "normal"}
      revision="participant-broadcast-draft"
      isOpen
      currentLogoUrl={draft.logoReference ?? undefined}
      saveLabel={text.continue}
      onCancel={onCancel}
      onPreview={onPreview}
      onSave={onContinue}
      onRestoreDefault={() => createAnnouncementPayload(defaultMessages)}
    />
  );
}
