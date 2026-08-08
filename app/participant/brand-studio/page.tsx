import { redirect } from "next/navigation";
import { getParticipantSession } from "../../../lib/auth/currentUserSession";
import ParticipantBrandStudioPage from "../components/ParticipantBrandStudioPage";

export default async function ParticipantBrandStudioRoute() {
  const session = await getParticipantSession();
  if (!session?.participantId) redirect("/seller/login");
  return <ParticipantBrandStudioPage participantId={session.participantId} />;
}
