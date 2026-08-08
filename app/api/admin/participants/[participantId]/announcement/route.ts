import {
  participantAccessResponse,
  requireAdminSession,
} from "../../../../../../lib/auth/participantAccess";
import {
  getParticipantAnnouncement,
  getParticipantAnnouncementView,
  publishParticipantAnnouncement,
} from "../../../../../../lib/announcements/store";
import {
  createAnnouncementPayload,
  type AnnouncementMessages,
} from "../../../../../../lib/announcements/types";
import { parseAnnouncementPayload } from "../../../../../../lib/announcements/validation";
import { getParticipantProfile } from "../../../../../../lib/participants/registry";

type RouteContext = {
  params: Promise<{ participantId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { participantId } = await context.params;
    if (!getParticipantProfile(participantId)) {
      return Response.json({ error: "participant-not-found" }, { status: 404 });
    }
    return Response.json(getParticipantAnnouncementView(participantId));
  } catch (error) {
    return participantAccessResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { participantId } = await context.params;
    if (!getParticipantProfile(participantId)) {
      return Response.json({ error: "participant-not-found" }, { status: 404 });
    }
    const body = await request.json() as Record<string, unknown>;
    const messages = body.messages as AnnouncementMessages | undefined;
    if (!messages) {
      return Response.json({ error: "messages-required" }, { status: 400 });
    }
    const current = getParticipantAnnouncement(participantId)?.latestSaved;
    const base = current ?? createAnnouncementPayload(messages);
    const payload = parseAnnouncementPayload({
      ...base,
      ...body,
      messages,
      formatting: body.formatting ?? base.formatting,
    });
    const participant = publishParticipantAnnouncement(participantId, payload);
    const view = getParticipantAnnouncementView(participantId);
    return Response.json({
      target: "participant",
      announcement: participant.latestSaved,
      ...view,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ANNOUNCEMENT") {
      return Response.json(
        { error: "invalid-announcement-payload" },
        { status: 400 },
      );
    }
    return participantAccessResponse(error);
  }
}
