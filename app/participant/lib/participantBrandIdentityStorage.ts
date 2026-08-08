"use client";

export type ParticipantBrandIdentity = {
  participantId: string;
  brandName: string;
  tagline?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  fontFamily?: string;
  updatedAt: string;
};

export const PARTICIPANT_BRAND_IDENTITY_CHANGE_EVENT =
  "participant-brand-identity-change";

export function participantBrandIdentityStorageKey(participantId: string) {
  const normalizedParticipantId = participantId.trim();
  if (!normalizedParticipantId) {
    throw new Error("participantId-required");
  }
  return `participant-brand-identity:${normalizedParticipantId}`;
}

function isParticipantBrandIdentity(
  value: unknown,
  participantId: string,
): value is ParticipantBrandIdentity {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Partial<ParticipantBrandIdentity>;
  return (
    record.participantId === participantId &&
    typeof record.brandName === "string" &&
    typeof record.updatedAt === "string"
  );
}

export function loadParticipantBrandIdentity(
  participantId: string,
): ParticipantBrandIdentity | null {
  if (typeof window === "undefined") return null;
  const key = participantBrandIdentityStorageKey(participantId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  return isParticipantBrandIdentity(parsed, participantId) ? parsed : null;
}

export function saveParticipantBrandIdentity(
  participantId: string,
  payload: Omit<ParticipantBrandIdentity, "participantId" | "updatedAt">,
): ParticipantBrandIdentity {
  const key = participantBrandIdentityStorageKey(participantId);
  const saved: ParticipantBrandIdentity = {
    ...payload,
    participantId,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(key, JSON.stringify(saved));
  window.dispatchEvent(
    new CustomEvent(PARTICIPANT_BRAND_IDENTITY_CHANGE_EVENT, {
      detail: saved,
    }),
  );
  return saved;
}
