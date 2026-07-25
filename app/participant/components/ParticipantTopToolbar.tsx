"use client";

import { Home, Menu, Settings, UserRound } from "lucide-react";
import { useRef } from "react";
import type { Lang } from "../../../locales";
import { createTranslator } from "../../../locales";
import {
  DkIconButton,
  DkLanguageMenu,
  DkToolbar,
  DkToolbarGroup,
  readMenuAnchor,
  type DkMenuAnchor,
} from "../../components/ui";

type ParticipantTopToolbarProps = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isMenuOpen: boolean;
  onToggleMenu: (anchor: DkMenuAnchor) => void;
};

export default function ParticipantTopToolbar({
  lang,
  setLang,
  isMenuOpen,
  onToggleMenu,
}: ParticipantTopToolbarProps) {
  const menuRef = useRef<HTMLSpanElement>(null);
  const direction = lang === "ar" ? "rtl" : "ltr";
  const t = createTranslator(lang);

  return (
    <DkToolbar className="publicFloatingToolbar participantHomeToolbar" aria-label={t("participantStudio.navigationLabel")}>
      <nav className="publicSecondaryActions" dir={direction} aria-label={t("participantStudio.navigationLabel")}>
        <span className="participantHomeToolbarMenuAnchor" ref={menuRef}>
          <DkIconButton
            icon={<Menu />}
            label={t("toolbar.openMenu")}
            className="publicHeaderIconButton participantHomeToolbarButton"
            variant="glass"
            size="md"
            aria-controls="participant-navigation"
            aria-expanded={isMenuOpen}
            onClick={() => {
              if (menuRef.current) onToggleMenu(readMenuAnchor(menuRef.current));
            }}
          />
        </span>
        <DkIconButton
          href="/participant"
          icon={<Home />}
          label={t("participantStudio.title")}
          className="publicHeaderIconButton participantHomeToolbarButton"
          variant="glass"
          size="md"
        />
        <DkIconButton
          href="/participant/settings"
          icon={<Settings />}
          label={t("toolbar.openSettings")}
          className="publicHeaderIconButton participantHomeToolbarButton"
          variant="glass"
          size="md"
        />
        <DkLanguageMenu
          className="publicLanguage participantHomeLanguage"
          language={lang}
          direction={direction}
          label={t("toolbar.changeLanguage")}
          onChange={setLang}
        />
      </nav>
      <div className="publicHeaderSearchRow participantHomeToolbarSpacer" aria-hidden="true" />
      <DkToolbarGroup position="end" className="publicHeaderEndGroup participantHomeProfileGroup">
        <DkIconButton
          href="/participant/settings"
          icon={<UserRound />}
          label={t("toolbar.account")}
          className="publicHeaderIconButton participantHomeToolbarButton participantHomeToolbarAvatar"
          variant="glass"
          size="md"
        />
      </DkToolbarGroup>
    </DkToolbar>
  );
}
