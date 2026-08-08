"use client";

import type { Lang } from "../../../locales";
import { DkAnchoredMenu, DkButton } from "../../components/ui";

export const PARTICIPANT_ACTIVITY_SELECTOR_OPEN_EVENT =
  "participant-activity-selector-open";

const activityOptions = [
  "شموع",
  "علب وتغليف",
  "هدايا",
  "أطفال وألعاب تعليمية",
  "ديكور جبسي",
  "منتجات خشبية",
  "طباعة ثلاثية الأبعاد",
  "خدمات",
  "أخرى",
] as const;

const copy = {
  ar: {
    title: "اختر نشاطك",
    close: "إغلاق اختيار النشاط",
    description: "اختر النشاط الأساسي الذي ستبني عليه هوية علامتك.",
  },
  de: {
    title: "Aktivität auswählen",
    close: "Aktivitätsauswahl schließen",
    description: "Wähle die Hauptaktivität für deine Markenidentität.",
  },
  en: {
    title: "Choose your activity",
    close: "Close activity selection",
    description: "Choose the primary activity for your brand identity.",
  },
  fr: {
    title: "Choisissez votre activité",
    close: "Fermer la sélection d’activité",
    description: "Choisissez l’activité principale de votre identité de marque.",
  },
} as const;

type ParticipantActivitySelectorDrawerProps = {
  lang: Lang;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (activity: string) => void;
};

export default function ParticipantActivitySelectorDrawer({
  lang,
  isOpen,
  onClose,
  onSelect,
}: ParticipantActivitySelectorDrawerProps) {
  const labels = copy[lang];

  return (
    <DkAnchoredMenu
      id="participant-activity-selector"
      isOpen={isOpen}
      anchor={null}
      direction={lang === "ar" ? "rtl" : "ltr"}
      label={labels.title}
      closeLabel={labels.close}
      className="participantNavigationDrawer dk-sidebar-panel"
      backdropClassName="participantNavigationBackdrop"
      onClose={onClose}
    >
      <div className="participantNavigationList">
        <strong>{labels.title}</strong>
        <p>{labels.description}</p>
        {activityOptions.map((activity) => (
          <DkButton
            key={activity}
            type="button"
            variant="transparent"
            size="md"
            onClick={() => onSelect(activity)}
          >
            {activity}
          </DkButton>
        ))}
      </div>
    </DkAnchoredMenu>
  );
}
