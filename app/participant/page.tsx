import { redirect } from "next/navigation";
import { getParticipantSession } from "../../lib/auth/currentUserSession";

export default async function ParticipantPage() {
  const session = await getParticipantSession();
  if (!session?.participantId) redirect("/seller/login");
  return null;
}
