import "server-only";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_SHARED_SESSION_COOKIE,
  PARTICIPANT_SESSION_COOKIE,
  parseCurrentUserSession,
  type CurrentUserSession,
} from "./sessionTypes";

async function readRoleSession(
  cookieName: string,
  role: CurrentUserSession["role"],
) {
  const store = await cookies();
  const current = parseCurrentUserSession(store.get(cookieName)?.value);
  if (current?.role === role) return current;

  const legacy = parseCurrentUserSession(
    store.get(LEGACY_SHARED_SESSION_COOKIE)?.value,
  );
  return legacy?.role === role ? legacy : null;
}

export function getParticipantSession() {
  return readRoleSession(PARTICIPANT_SESSION_COOKIE, "participant");
}

export function getAdminSession() {
  return readRoleSession(ADMIN_SESSION_COOKIE, "admin");
}

export async function getCurrentUserSession(): Promise<CurrentUserSession | null> {
  return (await getParticipantSession()) ?? getAdminSession();
}
