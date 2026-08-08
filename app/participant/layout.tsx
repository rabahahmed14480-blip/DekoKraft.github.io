import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import ParticipantStudioShell from "./components/ParticipantStudioShell";
import { getParticipantSession } from "../../lib/auth/currentUserSession";
import "../admin/admin-v2.css";
import "./participant.css";

export default async function ParticipantLayout({ children }: { children: ReactNode }) {
  const session = await getParticipantSession();
  if (!session?.participantId) redirect("/seller/login");
  return <ParticipantStudioShell participantId={session.participantId}>{children}</ParticipantStudioShell>;
}
