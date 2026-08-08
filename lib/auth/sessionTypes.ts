import type { ParticipantId } from "../participants/types";

export const PARTICIPANT_SESSION_COOKIE = "dekokraft_participant_session_v1";
export const ADMIN_SESSION_COOKIE = "dekokraft_admin_session_v1";
export const LEGACY_SHARED_SESSION_COOKIE = "dekokraft_user_session_v1";

export interface CurrentUserSession {
  role: "admin" | "participant";
  participantId?: ParticipantId;
  name?: string;
  storeName?: string;
  email?: string;
}

export function parseCurrentUserSession(value: string | undefined): CurrentUserSession | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (record.role === "admin") return { role: "admin", name: typeof record.name === "string" ? record.name : undefined, email: typeof record.email === "string" ? record.email : undefined };
    if (record.role === "participant" && typeof record.participantId === "string" && record.participantId) {
      return {
        role: "participant",
        participantId: record.participantId,
        name: typeof record.name === "string" ? record.name : undefined,
        storeName: typeof record.storeName === "string" ? record.storeName : undefined,
        email: typeof record.email === "string" ? record.email : undefined,
      };
    }
  } catch { return null; }
  return null;
}

export function serializeCurrentUserSession(session: CurrentUserSession) {
  return encodeURIComponent(JSON.stringify(session));
}
