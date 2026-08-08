"use client";

import type { ReactNode } from "react";
import { useLanguage } from "../../../components/LanguageProvider";
import { DkButton } from "../../../components/ui";
import { routes } from "../../../config/routes";

export type WelcomeContentSlots = {
  beforeTitle?: ReactNode;
  afterDescription?: ReactNode;
};

export default function WelcomeContentEngine({ beforeTitle, afterDescription }: WelcomeContentSlots = {}) {
  const { t } = useLanguage();

  return (
    <div className="echoWelcomeContent">
      {beforeTitle}
      <h2 id="echo-welcome-card-title">
        {t("homepage.welcome.title")} {" "}
        <span>{t("homepage.welcome.highlightedTitle")}</span>
      </h2>
      <p>{t("homepage.welcome.description")}</p>
      {afterDescription}
      <div className="echoWelcomeContent__actions">
        <DkButton href={routes.studio} variant="primary" size="md">
          {t("homepage.welcome.primaryCTA")}
        </DkButton>
        <DkButton href={routes.market} variant="glass" size="md">
          {t("homepage.welcome.secondaryCTA")}
        </DkButton>
      </div>
    </div>
  );
}
