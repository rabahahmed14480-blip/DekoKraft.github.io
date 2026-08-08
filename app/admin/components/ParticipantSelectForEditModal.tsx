"use client";

import { createPortal } from "react-dom";
import type { Lang } from "../../../locales";
import type { BroadcastParticipant } from "./ParticipantBroadcastModal";

type ParticipantSelectForEditModalProps = {
  lang: Lang;
  participants: BroadcastParticipant[];
  onSelect: (participantId: string) => void;
  onClose: () => void;
};

const copy = {
  ar: { title: "اختيار مشارك للتحرير", edit: "تحرير", close: "إغلاق" },
  de: { title: "Teilnehmer zum Bearbeiten wählen", edit: "Bearbeiten", close: "Schließen" },
  en: { title: "Select participant to edit", edit: "Edit", close: "Close" },
  fr: { title: "Choisir un participant à modifier", edit: "Modifier", close: "Fermer" },
} as const;

export default function ParticipantSelectForEditModal({
  lang,
  participants,
  onSelect,
  onClose,
}: ParticipantSelectForEditModalProps) {
  const text = copy[lang];

  return createPortal(
    <div className="participantSelectForEditBackdrop" role="presentation">
      <section
        className="participantSelectForEditModal dk-glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-edit-select-title"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <header>
          <h2 id="participant-edit-select-title">{text.title}</h2>
        </header>
        <div className="participantBroadcastList">
          {participants.length === 0 ? (
            <div className="participantSelectEmpty">
              لا يوجد مشاركون متاحون.
            </div>
          ) : participants.map((participant) => (
            <button
              type="button"
              className="participantBroadcastRow"
              key={participant.id}
              onClick={() => onSelect(participant.id)}
            >
              <span className="participantBroadcastName">{participant.name}</span>
              <span className="participantBroadcastId">{participant.id}</span>
              <span>{text.edit}</span>
            </button>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>{text.close}</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
