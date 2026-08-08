"use client";

import {
  BadgeHelp,
  Building2,
  CreditCard,
  Gavel,
  HeartHandshake,
  Info,
  Mail,
  PackageCheck,
  Puzzle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { createTranslator, getTextDirection, type Direction, type Lang } from "../../../locales";
import { useLanguage } from "../LanguageProvider";
import HomepageSurface from "../home-v2/HomepageSurface";
import { DkCreatorButton, DkGlassPanel } from "../ui";
import { classNames } from "../ui/classNames";
import { routes } from "../../config/routes";

export type DkServiceKey =
  | "about"
  | "association"
  | "shipping"
  | "payment"
  | "dataProtection"
  | "privacy"
  | "faq"
  | "contact"
  | "legal"
  | "futureTool";

export type DkServiceItem = {
  key: DkServiceKey;
  icon: LucideIcon;
  href?: string;
};

export const dkServicesCenterItems: DkServiceItem[] = [
  { key: "about", icon: Info, href: routes.info("about") },
  { key: "association", icon: HeartHandshake, href: routes.info("association") },
  { key: "shipping", icon: PackageCheck, href: routes.info("shipping") },
  { key: "payment", icon: CreditCard, href: routes.info("payment") },
  { key: "dataProtection", icon: ShieldCheck, href: routes.info("data-protection") },
  { key: "privacy", icon: Building2, href: routes.info("privacy") },
  { key: "faq", icon: BadgeHelp, href: routes.info("faq") },
  { key: "contact", icon: Mail, href: routes.info("contact") },
  { key: "legal", icon: Gavel, href: routes.info("legal") },
  { key: "futureTool", icon: Puzzle, href: routes.info("future-tool") },
];

type DkServicesCenterProps = {
  locale?: Lang;
  direction?: Direction;
  className?: string;
  variant?: "default" | "compact";
  items?: DkServiceItem[];
  surface?: "glass" | "homepage";
};

export default function DkServicesCenter({
  locale,
  direction,
  className,
  variant = "default",
  items = dkServicesCenterItems,
  surface = "glass",
}: DkServicesCenterProps) {
  const language = useLanguage();
  const activeLocale = locale ?? language.lang;
  const t = locale ? createTranslator(activeLocale) : language.t;
  const activeDirection = direction ?? getTextDirection(activeLocale);
  const [notice, setNotice] = useState("");

  const surfaceClassName = classNames(
    "dk-services-center",
    `dk-services-center--${variant}`,
    className,
  );
  const content = (
    <>
      <header className="dk-services-center__header" dir={activeDirection}>
        <h2>{t("servicesCenter.title")}</h2>
        <p>{t("servicesCenter.description")}</p>
      </header>

      <nav
        className="dk-services-center__grid"
        aria-label={t("servicesCenter.navigationLabel")}
        dir={activeDirection}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DkCreatorButton
              key={item.key}
              className="dk-services-center__item"
              href={item.href}
              icon={<Icon />}
              label={t(`servicesCenter.${item.key}`)}
              onClick={item.href ? undefined : () => setNotice(t("servicesCenter.futureNotice"))}
            />
          );
        })}
      </nav>

      {notice && (
        <p className="dk-services-center__notice" role="status" aria-live="polite">
          {notice}
        </p>
      )}
    </>
  );

  return surface === "homepage" ? (
    <HomepageSurface
      as="section"
      className={surfaceClassName}
      aria-label={t("servicesCenter.navigationLabel")}
    >
      {content}
    </HomepageSurface>
  ) : (
    <DkGlassPanel
      as="section"
      strength="subtle"
      className={surfaceClassName}
      aria-label={t("servicesCenter.navigationLabel")}
    >
      {content}
    </DkGlassPanel>
  );
}
