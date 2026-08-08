import {
  participantAccessResponse,
  resolveRequestParticipantId,
} from "../../../../lib/auth/participantAccess";
import {
  disableParticipantAnnouncement,
  getParticipantAnnouncementView,
  publishParticipantAnnouncement,
  restoreParticipantAnnouncement,
} from "../../../../lib/announcements/store";
import { parseAnnouncementPayload } from "../../../../lib/announcements/validation";

type AnnouncementOperation = "get" | "save" | "restore" | "disable";
type ParticipantAnnouncementCommand = {
  target?: unknown;
  participantId?: unknown;
  operation?: unknown;
  payload?: unknown;
};

function logAnnouncementResponse(
  operation: AnnouncementOperation,
  request: Request,
  payload: unknown,
  status: number,
  body: unknown,
  error?: unknown,
) {
  const details = {
    request: {
      method: request.method,
      url: request.url,
      contentType: request.headers.get("content-type"),
    },
    payload,
    response: { status, body },
  };
  if (error) {
    console.error(`[Participant announcement API:${operation}]`, details, error);
    return;
  }
  console.info(`[Participant announcement API:${operation}]`, details);
}

function announcementResponse(
  operation: AnnouncementOperation,
  request: Request,
  payload: unknown,
  body: unknown,
  status = 200,
) {
  logAnnouncementResponse(operation, request, payload, status, body);
  return Response.json(body, { status });
}

function announcementErrorResponse(
  operation: AnnouncementOperation,
  request: Request,
  payload: unknown,
  error: unknown,
) {
  if (error instanceof Error && error.message === "INVALID_ANNOUNCEMENT") {
    const body = { error: "Invalid announcement payload." };
    logAnnouncementResponse(operation, request, payload, 400, body, error);
    return Response.json(body, { status: 400 });
  }
  if (error instanceof Error && error.message === "NO_SAVED_ANNOUNCEMENT") {
    const body = { error: "No saved participant announcement." };
    logAnnouncementResponse(operation, request, payload, 409, body, error);
    return Response.json(body, { status: 409 });
  }

  const response = participantAccessResponse(error);
  const body = { error: "Participant announcement request failed." };
  logAnnouncementResponse(operation, request, payload, response.status, body, error);
  return response;
}

export async function GET(request: Request) {
  const payload = {
    participantId:
      new URL(request.url).searchParams.get("participantId") ?? undefined,
  };
  try {
    const participantId = await resolveRequestParticipantId(payload.participantId);
    if (!participantId) {
      return announcementResponse(
        "get",
        request,
        payload,
        { error: "Participant is required." },
        400,
      );
    }
    const view = getParticipantAnnouncementView(participantId);
    const body = {
      target: "participant" as const,
      announcement: view.participantAnnouncement,
      ...view,
    };
    return announcementResponse("get", request, payload, body);
  } catch (error) {
    return announcementErrorResponse("get", request, payload, error);
  }
}

async function handleParticipantAnnouncementCommand(request: Request) {
  let operation: AnnouncementOperation = "save";
  let payload: unknown;
  try {
    const command =
      await request.json() as ParticipantAnnouncementCommand;
    payload = command;
    if (command.target !== "participant") {
      return announcementResponse(
        operation,
        request,
        payload,
        { error: "participant-target-required" },
        400,
      );
    }
    if (
      typeof command.participantId !== "string" ||
      !command.participantId.trim()
    ) {
      return announcementResponse(
        operation,
        request,
        payload,
        { error: "participantId-required" },
        400,
      );
    }
    const participantId = await resolveRequestParticipantId(
      command.participantId,
    );
    if (!participantId) {
      return announcementResponse(
        operation,
        request,
        payload,
        { error: "participantId-required" },
        400,
      );
    }

    if (command.operation === "save") {
      const parsedPayload = parseAnnouncementPayload(command.payload);
      const participant = publishParticipantAnnouncement(
        participantId,
        parsedPayload,
      );
      const view = getParticipantAnnouncementView(participantId);
      const body = {
        target: "participant" as const,
        announcement: view.participantAnnouncement,
        ...view,
        participant,
      };
      return announcementResponse(operation, request, payload, body);
    }

    if (command.operation === "disable") {
      operation = "disable";
      const participant = disableParticipantAnnouncement(participantId);
      const view = getParticipantAnnouncementView(participantId);
      const body = {
        target: "participant" as const,
        announcement: view.participantAnnouncement,
        ...view,
        participant,
      };
      return announcementResponse(operation, request, payload, body);
    }

    if (command.operation !== "restore") {
      return announcementResponse(
        operation,
        request,
        payload,
        { error: "participant-operation-required" },
        400,
      );
    }
    operation = "restore";
    const participant = restoreParticipantAnnouncement(participantId);
    const view = getParticipantAnnouncementView(participantId);
    const body = {
      target: "participant" as const,
      announcement: view.participantAnnouncement,
      ...view,
      participant,
    };
    return announcementResponse(operation, request, payload, body);
  } catch (error) {
    return announcementErrorResponse(operation, request, payload, error);
  }
}

export function POST(request: Request) {
  return handleParticipantAnnouncementCommand(request);
}
