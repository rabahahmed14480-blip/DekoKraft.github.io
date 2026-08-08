"use client";

import { useLanguage } from "../../../components/LanguageProvider";

const ITEMS = ["limitless", "global", "supportive", "trusted"] as const;

export default function CreativityBar() {
  const { t } = useLanguage();

  return (
    <section className="echoCreativityBar publicContentContainer" aria-label={t("homepage.creativity.label")}>
      {ITEMS.map((item) => <span key={item}>{t(`homepage.creativity.${item}`)}</span>)}
    </section>
  );
}
