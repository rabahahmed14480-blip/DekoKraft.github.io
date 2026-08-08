"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import DkDashboardGrid from "../../../components/platform/DkDashboardGrid";
import { adminDashboardItems } from "../../config/adminDashboardItems";
import DekoCleanDashboardIndicators from "./DekoCleanDashboardIndicators";

export default function AdminDashboardGrid() {
  const { t } = useLanguage();
  const items = adminDashboardItems.map((item) => ({
    ...item,
    label: t(item.labelKey),
    description: item.descriptionKey ? t(item.descriptionKey) : undefined,
    indicators: item.id === "dekoclean" ? <DekoCleanDashboardIndicators /> : undefined,
  }));

  return <DkDashboardGrid items={items} label={t("admin.dashboard.quickTitle")} />;
}
