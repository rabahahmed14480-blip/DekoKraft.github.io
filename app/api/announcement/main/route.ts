import { getAdminAnnouncement } from "../../../../lib/announcements/store";

export async function GET() {
  return Response.json(getAdminAnnouncement());
}
