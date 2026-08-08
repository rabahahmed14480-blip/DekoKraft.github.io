"use client";

import { Palette } from "lucide-react";
import { useLanguage } from "../../components/LanguageProvider";
import DkDashboardGrid, {
  type DkDashboardGridItem,
} from "../../components/platform/DkDashboardGrid";
import DkServicesCenter from "../../components/platform/DkServicesCenter";
import { routes } from "../../config/routes";
import { participantNavigationItems } from "../participantNavigation";
import ParticipantSecurityCard from "./ParticipantSecurityCard";
import StudioUpdatesCard from "./StudioUpdatesCard";

export default function ParticipantStudioDashboard({ viewerRole = "participant", participantId }: { viewerRole?: "participant" | "admin"; participantId?: string }) {
  const { lang, direction, t } = useLanguage();
  const items: DkDashboardGridItem[] = participantNavigationItems.flatMap((item) => {
    const dashboardItem: DkDashboardGridItem = {
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
    };

    if (item.key !== "studio") return [dashboardItem];

    return [
      dashboardItem,
      {
        ...dashboardItem,
        id: "echlogo-studio",
        label: "EchoLogo Studio",
        icon: Palette,
        href: routes.participant.brandStudio,
        testId: "echlogo-studio-card",
      },
    ];
  });

  return (
    <>
      <DkDashboardGrid
        items={items}
        label={t("participantStudio.navigationLabel")}
        cardSurface="homepage"
      >
        <StudioUpdatesCard viewerRole={viewerRole} />
      </DkDashboardGrid>
      {viewerRole === "participant" && <ParticipantSecurityCard />}
      <DkServicesCenter locale={lang} direction={direction} surface="homepage" />
    </>
  );
}
