"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Lang } from "../../../locales";
import type { AnnouncementPayload } from "../../../lib/announcements/types";

export type BroadcastParticipant = {
  id: string;
  name: string;
};

type ParticipantBroadcastModalProps = {
  isOpen: boolean;
  lang: Lang;
  participants: BroadcastParticipant[];
  announcement: AnnouncementPayload;
  onClose: () => void;
  onBack: () => void;
  onBroadcastComplete: (participantIds: string[]) => void;
};

const copy = {
  ar: {
    title: "إعلانات المشاركين",
    description: "اختر المشاركين الذين تريد بدء دورة بث جديدة لإشعاراتهم.",
    send: "إرسال الإشعار",
    sending: "جارٍ الإرسال…",
    cancel: "إلغاء",
    back: "رجوع",
    error: "تعذر إرسال الإشعار.",
    all: "الجميع",
  },
  de: {
    title: "Teilnehmeranzeigen",
    description:
      "Wählen Sie Teilnehmer für eine neue Übertragung ihrer Meldung aus.",
    send: "Meldung senden",
    sending: "Wird gesendet…",
    cancel: "Abbrechen",
    back: "Zurück",
    error: "Die Meldung konnte nicht gesendet werden.",
    all: "Alle",
  },
  en: {
    title: "Participant Announcements",
    description:
      "Select participants to start a new broadcast of their announcement.",
    send: "Send announcement",
    sending: "Sending…",
    cancel: "Cancel",
    back: "Back",
    error: "The announcement could not be sent.",
    all: "All",
  },
  fr: {
    title: "Annonces des participants",
    description:
      "Sélectionnez les participants pour relancer la diffusion de leur annonce.",
    send: "Envoyer l’annonce",
    sending: "Envoi…",
    cancel: "Annuler",
    back: "Retour",
    error: "Impossible d’envoyer l’annonce.",
    all: "Tous",
  },
} as const;

export default function ParticipantBroadcastModal({
  isOpen,
  lang,
  participants,
  announcement,
  onClose,
  onBack,
  onBroadcastComplete,
}: ParticipantBroadcastModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] =
    useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const allCheckboxRef = useRef<HTMLInputElement>(null);
  const text = copy[lang];
  const availableParticipantIds = participants.map(
    (participant) => participant.id,
  );
  const allSelected =
    availableParticipantIds.length > 0 &&
    availableParticipantIds.every((id) => selectedParticipantIds.has(id));
  const someSelected = availableParticipantIds.some((id) =>
    selectedParticipantIds.has(id),
  );
  const partiallySelected = someSelected && !allSelected;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedParticipantIds(new Set());
    setError("");
    setIsSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, isSubmitting, onClose]);

  function toggleParticipant(participantId: string) {
    setSelectedParticipantIds((current) => {
      const next = new Set(current);
      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
      }
      return next;
    });
  }

  function toggleAllParticipants() {
    setSelectedParticipantIds(() => {
      if (allSelected) {
        return new Set();
      }
      return new Set(availableParticipantIds);
    });
  }

  async function handleBroadcast() {
    if (selectedParticipantIds.size === 0) return;
    setIsSubmitting(true);
    setError("");
    try {
      const participantIds = Array.from(selectedParticipantIds);
      const saveResponses = await Promise.all(
        participantIds.map((participantId) =>
          fetch(
            `/api/admin/participants/${encodeURIComponent(participantId)}/announcement`,
            {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(announcement),
            },
          )
        ),
      );
      if (saveResponses.some((response) => !response.ok)) {
        throw new Error("participant-announcement-save-failed");
      }
      const response = await fetch(
        "/api/admin/participant-announcements/broadcast",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            participantIds,
            messages: announcement.messages,
            formatting: announcement.formatting,
            language: announcement.language,
            logoReference: announcement.logoReference,
            logoSize: announcement.logoSize,
            speed: announcement.speed ?? "normal",
          }),
        },
      );
      if (!response.ok) throw new Error("broadcast-failed");
      onBroadcastComplete(participantIds);
      setSelectedParticipantIds(new Set());
      onClose();
    } catch {
      setError(text.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="participantBroadcastOverlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        className="participantBroadcastModal dk-glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-broadcast-title"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <header>
          <h2 id="participant-broadcast-title">{text.title}</h2>
          <p>{text.description}</p>
        </header>

        <label className="participantBroadcastAllRow">
          <input
            ref={allCheckboxRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleAllParticipants}
          />
          <span>{text.all}</span>
        </label>

        <div className="participantBroadcastList">
          {participants.map((participant) => (
            <label
              key={participant.id}
              className="participantBroadcastRow"
            >
              <input
                type="checkbox"
                checked={selectedParticipantIds.has(participant.id)}
                onChange={() => toggleParticipant(participant.id)}
              />
              <span className="participantBroadcastName">
                {participant.name}
              </span>
              <span className="participantBroadcastId">
                {participant.id}
              </span>
            </label>
          ))}
        </div>

        {error && <p className="participantBroadcastError" role="alert">{error}</p>}

        <footer>
          <button type="button" onClick={onBack} disabled={isSubmitting}>
            {text.back}
          </button>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            {text.cancel}
          </button>
          <button
            type="button"
            disabled={selectedParticipantIds.size === 0 || isSubmitting}
            onClick={handleBroadcast}
          >
            {isSubmitting ? text.sending : text.send}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
