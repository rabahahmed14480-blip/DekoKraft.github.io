"use client";

import Image from "next/image";
import type { Lang } from "../../../locales";
import {
  getAnnouncementDuration,
  type AnnouncementPayload,
  type AnnouncementSpeed,
} from "../../../lib/announcements/types";

type ParticipantAnnouncementBarProps = {
  lang: Lang;
  participantId: string;
  participantName?: string;
  participantLogoUrl?: string;
  announcement?: AnnouncementPayload | null;
  enabled?: boolean;
  broadcastRevision: number;
  animationRevision: number;
  speed?: AnnouncementSpeed;
};

function ParticipantAnnouncementSequence({
  text,
  lang,
  logoUrl,
  logoSize,
  participantName,
  formatting,
  duplicate = false,
}: {
  text: string;
  lang: Lang;
  logoUrl?: string;
  logoSize: number;
  participantName?: string;
  formatting?: AnnouncementPayload["formatting"][Lang];
  duplicate?: boolean;
}) {
  return (
    <span
      className="announcementSequence participantAnnouncementSequence"
      dir={lang === "ar" ? "rtl" : "ltr"}
      aria-hidden={duplicate || undefined}
    >
      <span
        className="announcementMessage"
        style={formatting ? {
          fontSize: `${formatting.fontSize}px`,
          fontWeight: formatting.bold ? 800 : undefined,
          fontStyle: formatting.italic ? "italic" : undefined,
          textAlign: formatting.alignment,
        } : undefined}
      >
        {text}
      </span>
      <span className="announcementGap announcementGapLarge" aria-hidden="true" />
      {logoUrl && (
        <span className="announcementLogo participantAnnouncementLogo">
          <Image
            src={logoUrl}
            alt={participantName || "Participant"}
            width={logoSize}
            height={logoSize}
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
            }}
            unoptimized
          />
        </span>
      )}
      <span className="announcementGap announcementGapLarge" aria-hidden="true" />
    </span>
  );
}

export default function ParticipantAnnouncementBar({
  lang,
  participantId,
  participantName,
  participantLogoUrl,
  announcement,
  enabled,
  broadcastRevision,
  animationRevision,
  speed,
}: ParticipantAnnouncementBarProps) {
  const direction = lang === "ar" ? "rtl" : "ltr";
  const formatting = announcement?.formatting[lang];
  const announcementText = announcement?.messages[lang]?.trim();
  const resolvedParticipantLogo =
    announcement?.logoReference || participantLogoUrl;
  const logoSize = announcement?.logoSize ?? 48;
  const text =
    announcementText ||
    announcement?.messages.ar?.trim() ||
    announcement?.messages.en?.trim() ||
    "";
  const duration = getAnnouncementDuration(
    speed ?? announcement?.speed ?? "normal",
  );

  if (enabled === false) return null;

  return (
    <div
      key={`${participantId}-${broadcastRevision}`}
      className="publicAnnouncement dk-glass participantHomeAnnouncement"
      data-announcement-direction={direction}
      dir={direction}
      role="status"
    >
      <div className="announcementViewport">
        <div
          key={`participant-${participantId}-${lang}-${broadcastRevision}-${animationRevision}`}
          className="announcementTrack participantAnnouncementTrack"
          style={{
            "--announcement-duration": duration,
          } as React.CSSProperties}
        >
          <ParticipantAnnouncementSequence
            text={text}
            lang={lang}
            logoUrl={resolvedParticipantLogo}
            logoSize={logoSize}
            participantName={participantName}
            formatting={formatting}
          />
          <ParticipantAnnouncementSequence
            text={text}
            lang={lang}
            logoUrl={resolvedParticipantLogo}
            logoSize={logoSize}
            participantName={participantName}
            formatting={formatting}
            duplicate
          />
        </div>
      </div>
    </div>
  );
}
