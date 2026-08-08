import {
  participantAccessResponse,
  requireAdminSession,
} from "../../../../../../../lib/auth/participantAccess";
import {
  getParticipantAnnouncementView,
  restoreParticipantAnnouncement,
} from "../../../../../../../lib/announcements/store";
import { getParticipantProfile } from "../../../../../../../lib/participants/registry";

type RouteContext = {
  params: Promise<{ participantId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { participantId } = await context.params;
    if (!getParticipantProfile(participantId)) {
      return Response.json({ error: "participant-not-found" }, { status: 404 });
    }
    const participant = restoreParticipantAnnouncement(participantId);
    const view = getParticipantAnnouncementView(participantId);
    return Response.json({
      target: "participant",
      announcement: participant.latestSaved,
      ...view,
    });
  } catch (error) {
    return participantAccessResponse(error);
  }
}
