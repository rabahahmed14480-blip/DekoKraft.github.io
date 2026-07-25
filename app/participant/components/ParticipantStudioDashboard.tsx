"use client";

import { useLanguage } from "../../components/LanguageProvider";
import DkDashboardGrid from "../../components/platform/DkDashboardGrid";
import DkServicesCenter from "../../components/platform/DkServicesCenter";
import { participantNavigationItems } from "../participantNavigation";
import ParticipantSecurityCard from "./ParticipantSecurityCard";
import StudioUpdatesCard from "./StudioUpdatesCard";

export default function ParticipantStudioDashboard({ viewerRole = "participant", participantId }: { viewerRole?: "participant" | "admin"; participantId?: string }) {
  const { lang, direction, t } = useLanguage();
  const items = participantNavigationItems.map((item) => ({
    ...item,
    id: item.key,
    label: t(item.labelKey),
    description: item.descriptionKey ? t(item.descriptionKey) : undefined,
    enabled: item.enabled,
    href: viewerRole === "admin" && participantId
      ? item.key === "maintenance"
        ? `/admin/participants/${participantId}/maintenance`
        : `/admin/participants/${participantId}#${item.key}`
      : item.href,
  }));

  return (
    <section className="participantDashboard" aria-label={t("participantStudio.title")}>
      <DkDashboardGrid items={items} label={t("participantStudio.navigationLabel")}>
        <StudioUpdatesCard viewerRole={viewerRole} />
      </DkDashboardGrid>
      {viewerRole === "participant" && <ParticipantSecurityCard />}
      <DkServicesCenter locale={lang} direction={direction} />
    </section>
  );
}
