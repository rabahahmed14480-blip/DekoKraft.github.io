import {
  participantAccessResponse,
  requireAdminSession,
} from "../../../../lib/auth/participantAccess";
import {
  getAdminAnnouncement,
  setAdminAnnouncement,
  stopAdminAnnouncement,
} from "../../../../lib/announcements/store";
import { parseAnnouncementPayload } from "../../../../lib/announcements/validation";

export async function GET() {
  try {
    await requireAdminSession();
    const record = getAdminAnnouncement();
    return Response.json({
      target: "main",
      announcement: record.active,
      ...record,
    });
  } catch (error) {
    return participantAccessResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const command = await request.json() as {
      target?: unknown;
      operation?: unknown;
      payload?: unknown;
    };
    if (command.target !== "main") {
      return Response.json(
        { error: "main-target-required" },
        { status: 400 },
      );
    }
    if (command.operation === "save") {
      const payload = parseAnnouncementPayload(command.payload);
      const record = setAdminAnnouncement(payload);
      return Response.json({
        target: "main",
        announcement: record.active,
        ...record,
      });
    }
    if (command.operation === "restore") {
      const record = stopAdminAnnouncement();
      return Response.json({
        target: "main",
        announcement: record.active,
        ...record,
      });
    }
    return Response.json(
      { error: "main-operation-required" },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ANNOUNCEMENT") {
      return Response.json(
        { error: "Invalid announcement payload." },
        { status: 400 },
      );
    }
    return participantAccessResponse(error);
  }
}
