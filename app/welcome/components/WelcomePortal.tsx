"use client";

import { DkButton, DkGlassPanel } from "../../components/ui";
import { useLanguage } from "../../components/LanguageProvider";
import PublicPageShell from "../../components/PublicPageShell";
import WelcomeCard from "./WelcomeCard";

type WelcomeCardDefinition = {
  id:
    | "home"
    | "market"
    | "artisans"
    | "join"
    | "login"
    | "about"
    | "comments"
    | "suggestions"
    | "services"
    | "studio";
  icon: string;
  href: string;
};

const cards: WelcomeCardDefinition[] = [
  { id: "home", icon: "🏠", href: "/" },
  { id: "market", icon: "🛍️", href: "/market" },
  { id: "artisans", icon: "🎨", href: "/info/artisans" },
  { id: "join", icon: "🧑‍🎨", href: "/register" },
  { id: "login", icon: "🔑", href: "/seller/login" },
  { id: "about", icon: "ℹ️", href: "/info/about" },
  { id: "comments", icon: "💬", href: "/info/comments" },
  { id: "suggestions", icon: "💡", href: "/info/suggestions" },
  { id: "services", icon: "🛠️", href: "/info/services" },
  { id: "studio", icon: "🧠", href: "/studio" },
];

export default function WelcomePortal() {
  const { direction, t } = useLanguage();
  const title = t("welcome.title");

  return (
    <PublicPageShell className="welcomePublicShell">
      <main className="welcomePage" dir={direction}>
        <div className="welcomePageContent">
          <DkGlassPanel as="section" strength="subtle" className="welcomePortalPanel">
            <header className="welcomePortalHeader">
              <h1>
                {title.replace("DekoKraft", "").trim()} <span>DekoKraft</span>
              </h1>
              <p>{t("welcome.subtitle")}</p>
            </header>

            <nav className="welcomePortalGrid" aria-label={t("welcome.navigationLabel")}>
              {cards.map((card) => (
                <WelcomeCard
                  key={card.id}
                  title={t(`welcome.cards.${card.id}`)}
                  icon={card.icon}
                  href={card.href}
                />
              ))}
            </nav>

            <DkButton
              type="button"
              className="welcomeReplayButton"
              size="sm"
              variant="transparent"
              onClick={() => window.location.reload()}
            >
              {t("welcome.replay")}
            </DkButton>
          </DkGlassPanel>
        </div>
      </main>
    </PublicPageShell>
  );
}
