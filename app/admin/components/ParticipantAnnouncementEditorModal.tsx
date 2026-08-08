"use client";

import { useEffect, useState } from "react";
import type { Lang } from "../../../locales";
import {
  createAnnouncementPayload,
  type AnnouncementPayload,
  type AnnouncementStatus,
} from "../../../lib/announcements/types";
import AnnouncementEditorModal from "../../components/announcements/AnnouncementEditorModal";

export type ParticipantAnnouncementView = {
  participantId: string;
  participantAnnouncement: AnnouncementPayload | null;
  participant: {
    participantId: string;
    active: AnnouncementPayload | null;
    latestSaved: AnnouncementPayload | null;
    previousSaved: AnnouncementPayload | null;
    enabled: boolean;
    broadcastRevision: number;
    lastBroadcastAt: string | null;
    status: AnnouncementStatus;
    updatedAt: string;
  } | null;
};

type ParticipantAnnouncementEditorModalProps = {
  participantId: string;
  lang: Lang;
  onClose: () => void;
  onBack: () => void;
  onSaved: (view: ParticipantAnnouncementView) => void;
};

const emptyAnnouncement = createAnnouncementPayload({
  ar: "",
  de: "",
  en: "",
  fr: "",
});

const titles = {
  ar: "تحرير إشعار المشارك",
  de: "Teilnehmeranzeige bearbeiten",
  en: "Edit participant announcement",
  fr: "Modifier l’annonce du participant",
} as const;

export default function ParticipantAnnouncementEditorModal({
  participantId,
  lang,
  onClose,
  onBack,
  onSaved,
}: ParticipantAnnouncementEditorModalProps) {
  const [view, setView] = useState<ParticipantAnnouncementView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      `/api/admin/participants/${encodeURIComponent(participantId)}/announcement`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("participant-announcement-load-failed");
        return response.json() as Promise<ParticipantAnnouncementView>;
      })
      .then(setView)
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setError("participant-announcement-load-failed");
        }
      });
    return () => controller.abort();
  }, [participantId]);

  if (!view && !error) return null;
  const announcement = view?.participantAnnouncement ?? emptyAnnouncement;

  return (
    <AnnouncementEditorModal
      key={`${participantId}-${view?.participant?.updatedAt ?? "empty"}`}
      isOpen
      announcementType="participant"
      title={`${titles[lang]} · ${participantId}`}
      lang={lang}
      initialValues={announcement.messages}
      initialFormatting={announcement.formatting}
      initialLanguage={announcement.language ?? lang}
      initialBannerThickness={
        announcement.bannerThickness ?? announcement.bannerHeight
      }
      initialBannerLength={
        announcement.bannerLength ?? announcement.bannerWidth
      }
      initialTextColor={announcement.textColor}
      initialBackgroundColor={announcement.backgroundColor}
      initialImageReference={announcement.imageReference}
      initialLogoSize={announcement.logoSize ?? 48}
      initialSpeed={announcement.speed ?? "normal"}
      revision={view?.participant?.updatedAt ?? participantId}
      currentLogoUrl={announcement.logoReference ?? undefined}
      feedback={error}
      onCancel={onBack}
      onPreview={(payload) => {
        if (!view) return;
        onSaved({
          ...view,
          participantAnnouncement: payload,
        });
      }}
      onSave={async (payload) => {
        setError("");
        const response = await fetch(
          `/api/admin/participants/${encodeURIComponent(participantId)}/announcement`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          setError("participant-announcement-save-failed");
          throw new Error("participant-announcement-save-failed");
        }
        const saved = await response.json() as ParticipantAnnouncementView;
        setView(saved);
        onSaved(saved);
        onClose();
      }}
      onRestoreDefault={async () => {
        setError("");
        const response = await fetch(
          `/api/admin/participants/${encodeURIComponent(participantId)}/announcement/restore`,
          { method: "POST" },
        );
        if (!response.ok) {
          setError("participant-announcement-restore-failed");
          return undefined;
        }
        const restored = await response.json() as ParticipantAnnouncementView;
        setView(restored);
        onSaved(restored);
        return restored.participantAnnouncement ?? undefined;
      }}
    />
  );
}
