import "server-only";
import {
  getAdminSession,
  getCurrentUserSession,
  getParticipantSession,
} from "./currentUserSession";
import { normalizeParticipantId, type LegacyParticipantRecord } from "../participants/types";
import type { CurrentUserSession } from "./sessionTypes";

export class ParticipantAccessError extends Error {
  constructor(public status: 401 | 403 | 404, message: string) { super(message); }
}

export async function requireAuthenticatedUser() {
  const session = await getCurrentUserSession();
  if (!session) throw new ParticipantAccessError(401, "يجب تسجيل الدخول أولًا.");
  return session;
}

export async function requireParticipantSession() {
  const session = await getParticipantSession();
  if (!session) throw new ParticipantAccessError(401, "يجب تسجيل الدخول أولًا.");
  if (!session.participantId) throw new ParticipantAccessError(403, "غير مسموح لك بالوصول إلى بيانات هذا المشارك.");
  return session as CurrentUserSession & { role: "participant"; participantId: string };
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) throw new ParticipantAccessError(401, "يجب تسجيل الدخول أولًا.");
  return session as CurrentUserSession & { role: "admin" };
}

export function canAccessParticipant(session: CurrentUserSession, targetParticipantId: string) {
  return session.role === "admin" || (session.role === "participant" && session.participantId === targetParticipantId);
}

export function assertParticipantOwnership(record: LegacyParticipantRecord | null | undefined, participantId: string) {
  if (!record) throw new ParticipantAccessError(404, "لم يتم العثور على المشارك أو السجل المطلوب.");
  if (normalizeParticipantId(record) !== participantId) throw new ParticipantAccessError(403, "غير مسموح لك بالوصول إلى بيانات هذا المشارك.");
  return true;
}

export function participantAccessResponse(error: unknown) {
  if (error instanceof ParticipantAccessError) return Response.json({ error: error.message }, { status: error.status });
  console.error("[Participant Access] Unexpected authorization error.", error);
  return Response.json({ error: "تعذر التحقق من صلاحية الوصول." }, { status: 500 });
}

export async function resolveRequestParticipantId(requestedParticipantId?: string) {
  const [participantSession, adminSession] = await Promise.all([
    getParticipantSession(),
    getAdminSession(),
  ]);
  if (requestedParticipantId && adminSession) return requestedParticipantId;
  if (participantSession) {
    if (!participantSession.participantId) throw new ParticipantAccessError(401, "يجب تسجيل الدخول أولًا.");
    if (requestedParticipantId && requestedParticipantId !== participantSession.participantId) throw new ParticipantAccessError(403, "غير مسموح لك بالوصول إلى بيانات هذا المشارك.");
    return participantSession.participantId;
  }
  if (adminSession) return requestedParticipantId;
  if (requestedParticipantId) throw new ParticipantAccessError(401, "يجب تسجيل الدخول أولًا.");
  return undefined;
}
