"use client";

import Link from "next/link";
import type { Lang } from "../../../locales";

const copy: Record<Lang, { title: string; link: string }> = {
  ar: { title: "استوديو المشارك", link: "العودة إلى لوحة المشارك" },
  de: { title: "Teilnehmer-Studio", link: "Zurück zum Teilnehmer-Dashboard" },
  en: { title: "Participant Studio", link: "Back to Participant Dashboard" },
  fr: { title: "Studio participant", link: "Retour au tableau de bord" },
};

export default function ParticipantAnnouncementBar({ lang }: { lang: Lang }) {
  const content = copy[lang];
  const direction = lang === "ar" ? "rtl" : "ltr";

  return (
    <div
      className="publicAnnouncement participantHomeAnnouncement"
      data-announcement-direction={direction}
      dir={direction}
      role="status"
    >
      <div className="publicContentContainer participantHomeAnnouncementContent">
        <strong>{content.title}</strong>
        <Link href="/participant">{content.link}</Link>
      </div>
    </div>
  );
}
