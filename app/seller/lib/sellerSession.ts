"use client";

import {
  LEGACY_SHARED_SESSION_COOKIE,
  PARTICIPANT_SESSION_COOKIE,
  parseCurrentUserSession,
  serializeCurrentUserSession,
  type CurrentUserSession,
} from "../../../lib/auth/sessionTypes";

export interface SellerSession {
  sellerId: string;
  participantId: string;
  role: "participant";
  email: string;
  loggedInAt: string;
}

export const SELLER_SESSION_KEY = "dekokraft_current_seller_v1";

export function ensureParticipantSessionCookie(session: CurrentUserSession) {
  if (
    typeof document === "undefined" ||
    session.role !== "participant" ||
    !session.participantId
  ) {
    return;
  }
  document.cookie = `${PARTICIPANT_SESSION_COOKIE}=${serializeCurrentUserSession(session)}; Path=/; SameSite=Lax`;
}

export function saveSellerSession(session: SellerSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(session));
  ensureParticipantSessionCookie({
    role: "participant",
    participantId: session.participantId,
    name: session.sellerId,
    email: session.email,
  });
  document.cookie = `${LEGACY_SHARED_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function loadSellerSession(): SellerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(SELLER_SESSION_KEY) ?? "null") as Partial<SellerSession> | null;
    if (!value || typeof value.sellerId !== "string" || typeof value.email !== "string") return null;
    const session: SellerSession = {
      sellerId: value.sellerId,
      participantId: typeof value.participantId === "string" ? value.participantId : value.sellerId,
      role: "participant",
      email: value.email,
      loggedInAt: typeof value.loggedInAt === "string" ? value.loggedInAt : new Date().toISOString(),
    };
    if (!document.cookie.includes(`${PARTICIPANT_SESSION_COOKIE}=`)) {
      ensureParticipantSessionCookie({
        role: "participant",
        participantId: session.participantId,
        name: session.sellerId,
        email: session.email,
      });
    }
    document.cookie = `${LEGACY_SHARED_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return session;
  } catch { return null; }
}

export function loadCurrentUserSession(): CurrentUserSession | null {
  if (typeof document === "undefined") return null;
  const prefix = `${PARTICIPANT_SESSION_COOKIE}=`;
  const raw = document.cookie.split("; ").find((item) => item.startsWith(prefix))?.slice(prefix.length);
  return parseCurrentUserSession(raw);
}

export function clearSellerSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SELLER_SESSION_KEY);
  document.cookie = `${PARTICIPANT_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${LEGACY_SHARED_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getCurrentSellerId() {
  return loadSellerSession()?.participantId ?? null;
}
