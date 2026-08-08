import type { ComponentType } from "react";
import { getDashboardMenu } from "../config/dashboardMenu";

export type ParticipantSection =
  | "orders"
  | "customers"
  | "analytics"
  | "media"
  | "earnings"
  | "settings"
  | "studio"
  | "aiCost"
  | "invoices"
  | "inventory"
  | "maintenance"
  | "support";

export type ParticipantDashboardItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: ComponentType;
  enabled: boolean;
};

export type ParticipantNavigationItem = {
  key: ParticipantSection;
  href: string;
  icon: ComponentType;
  labelKey: string;
  descriptionKey?: string;
  enabled: boolean;
};

export const participantNavigationItems: ParticipantNavigationItem[] = getDashboardMenu("participant").map((item) => ({
  key: item.id as ParticipantSection,
  href: item.href,
  icon: item.icon,
  labelKey: item.labelKey,
  descriptionKey: item.descriptionKey,
  enabled: item.enabled,
}));
