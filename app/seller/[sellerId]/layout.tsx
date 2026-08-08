import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import SellerProtectedLayout from "../components/SellerProtectedLayout";
import { getAllSellers } from "../../data/sellers";
import { getParticipantSession } from "../../../lib/auth/currentUserSession";
import "../seller.css";

export function generateStaticParams() {
  return getAllSellers().map((seller) => ({ sellerId: seller.id }));
}

export default async function SellerLayout({ children, params }: { children: ReactNode; params: Promise<{ sellerId: string }> }) {
  const [{ sellerId }, session] = await Promise.all([params, getParticipantSession()]);
  if (!session || session.role !== "participant" || !session.participantId) redirect("/seller/login");
  if (session.participantId !== sellerId) redirect(`/seller/${session.participantId}`);
  return <SellerProtectedLayout sellerId={sellerId}>{children}</SellerProtectedLayout>;
}
