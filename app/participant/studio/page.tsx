import { redirect } from "next/navigation";
import { getParticipantSession } from "../../../lib/auth/currentUserSession";
import ParticipantStudioDashboard from "../components/ParticipantStudioDashboard";

export default async function ParticipantStudioPage() {
  const session = await getParticipantSession();
  if (!session?.participantId) redirect("/seller/login");
  return <ParticipantStudioDashboard participantId={session.participantId} />;
}
