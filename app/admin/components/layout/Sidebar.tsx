"use client";

import Link from "next/link";
import { CircleDollarSign, Landmark } from "lucide-react";
import { cmsTabs, type CmsTabId } from "../../config/cmsTabs";
import { type Lang } from "../../config/translations";
import { createTranslator, getTextDirection } from "../../../../locales";
import { DkAnchoredMenu, type DkMenuAnchor } from "../../../components/ui";
import { routes } from "../../../config/routes";

const aiCostLabels: Record<Lang, string> = {
  ar: "تكلفة الذكاء الاصطناعي",
  en: "AI cost",
  de: "KI-Kosten",
  fr: "Coûts IA",
};

type Props = {
  activeTab: CmsTabId;
  setActiveTab: (tab: CmsTabId) => void;
  lang: Lang;
  isOpen: boolean;
  anchor: DkMenuAnchor | null;
  onClose: () => void;
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  lang,
  isOpen,
  anchor,
  onClose,
}: Props) {
  const t = createTranslator(lang);
  const dir = getTextDirection(lang);

  return (
    <DkAnchoredMenu
        id="dk-admin-navigation"
        isOpen={isOpen}
        anchor={anchor}
        direction={dir}
        label={t("admin.dashboard.pageTitle")}
        closeLabel={t("buttons.close")}
        className="adminNavigationDrawer dk-sidebar-panel"
        backdropClassName="dkSidebarBackdrop"
        onClose={onClose}
      >
        <nav className="dkNavigation">
          {cmsTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => {
                setActiveTab(tab.id);
                onClose();
              }}
              className={`dkNavButton dk-sidebar-link ${activeTab === tab.id ? "active" : ""}`}
            >
              <span className="dkNavIcon">{tab.icon}</span>
              <span className="dkNavText">{t(`admin.sidebar.${tab.id}`)}</span>
            </button>
          ))}
          <Link
            href={routes.admin.aiCost}
            tabIndex={isOpen ? 0 : -1}
            onClick={onClose}
            className="dkNavButton dk-sidebar-link"
          >
            <span className="dkNavIcon"><CircleDollarSign aria-hidden="true" /></span>
            <span className="dkNavText">{aiCostLabels[lang]}</span>
          </Link>
          <Link
            href={routes.admin.financial}
            tabIndex={isOpen ? 0 : -1}
            onClick={onClose}
            className="dkNavButton dk-sidebar-link"
          >
            <span className="dkNavIcon"><Landmark aria-hidden="true" /></span>
            <span className="dkNavText">{t("dashboardCards.financial")}</span>
          </Link>
        </nav>
    </DkAnchoredMenu>
  );
}
