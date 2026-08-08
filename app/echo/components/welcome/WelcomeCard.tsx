"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import { DkBrand } from "../../../components/ui";
import { routes } from "../../../config/routes";
import { publicPath } from "../../../lib/publicPath";
import WelcomeContentEngine from "./WelcomeContentEngine";
import WelcomeMediaEngine from "./WelcomeMediaEngine";

export default function WelcomeCard() {
  const { t } = useLanguage();

  return (
    <section className="echoWelcomeCard publicContentContainer" aria-labelledby="echo-welcome-card-title">
      <WelcomeMediaEngine />
      <div className="echoWelcomeCard__content">
        <DkBrand
          className="echoWelcomeCard__brand"
          name={t("header.brand")}
          mediaSrc={publicPath("/logo-dekokraft-600.webp")}
          mediaType="image"
          fallbackImageSrc={publicPath("/logo-dekokraft-600.webp")}
          href={routes.home}
          mediaAlt=""
        />
        <WelcomeContentEngine />
      </div>
    </section>
  );
}
