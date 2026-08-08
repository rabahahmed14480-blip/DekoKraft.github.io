import {
  participantAccessResponse,
  requireAdminSession,
} from "../../../../../lib/auth/participantAccess";
import { broadcastParticipantAnnouncements } from "../../../../../lib/announcements/store";
import { isKnownParticipant } from "../../../../../lib/participants/registry";

type BroadcastCommand = {
  participantIds?: unknown;
};

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const command = await request.json() as BroadcastCommand;
    if (!Array.isArray(command.participantIds)) {
      return Response.json(
        { error: "participantIds-required" },
        { status: 400 },
      );
    }

    const participantIds = [
      ...new Set(
        command.participantIds.map((participantId) =>
          typeof participantId === "string" ? participantId.trim() : ""
        ),
      ),
    ];
    if (
      participantIds.length === 0 ||
      participantIds.some((participantId) => !participantId)
    ) {
      return Response.json(
        { error: "participantIds-invalid" },
        { status: 400 },
      );
    }

    const unknownParticipantIds = participantIds.filter(
      (participantId) => !isKnownParticipant(participantId),
    );
    if (unknownParticipantIds.length > 0) {
      return Response.json(
        {
          error: "participant-not-found",
          participantIds: unknownParticipantIds,
        },
        { status: 404 },
      );
    }

    const result = broadcastParticipantAnnouncements(participantIds);
    return Response.json({
      target: "participant",
      operation: "broadcast",
      ...result,
    });
  } catch (error) {
    return participantAccessResponse(error);
  }
}
