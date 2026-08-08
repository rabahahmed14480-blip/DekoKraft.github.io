"use client";

import Image from "next/image";
import EchoMediaEngine from "../../echo/components/media/EchoMediaEngine";
import { useLanguage } from "../LanguageProvider";
import { DkButton } from "../ui";
import DkPageHero from "../ui/DkPageHero";
import { routes } from "../../config/routes";
import { publicPath } from "../../lib/publicPath";

export default function HomeHero() {
  const { t } = useLanguage();
  return (
    <div className="echoHeroMediaStage publicContentContainer">
      <EchoMediaEngine slot="hero" />
      <DkPageHero
        className="homeHero"
        id="home-v2-title"
        title={
          <span className="dekokraftBrand" aria-label={t("homepage.title")}>
            <Image
              className="dekokraftBrandImage"
              src={publicPath("/logo-dekokraft-600.webp")}
              width={600}
              height={579}
              sizes="(max-width: 640px) 68px, 94px"
              alt=""
            />
            <span className="dekokraftBrandText" aria-hidden="true">
              <span className="dekokraftBrandInitial">D</span>
              <span className="dekokraftBrandRest">ekoKraft</span>
            </span>
          </span>
        }
        description={t("home.heroDescription")}
        actions={<DkButton href={routes.studio} variant="primary" size="md">{t("seller.openStudio")}</DkButton>}
        size="large"
      />
    </div>
  );
}
