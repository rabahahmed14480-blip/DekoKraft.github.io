"use client";

import { Megaphone, Menu, Settings, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import {
  DkIconButton,
  DkToolbar,
  DkToolbarGroup,
} from "../../components/ui";
import type { Lang } from "../../../locales";
import { useSellerSession } from "./SellerSessionProvider";

const languageOrder: Lang[] = ["ar", "en", "de", "fr"];
const announcementLabels: Record<Lang, string> = {
  ar: "إعلان المشارك",
  de: "Teilnehmeranzeige",
  en: "Participant Announcement",
  fr: "Annonce du participant",
};

export default function SellerTopToolbar({
  sellerId,
  isMenuOpen,
  isAnnouncementEditorOpen,
  onEditAnnouncement,
  onToggleMenu,
}: {
  sellerId: string;
  isMenuOpen: boolean;
  isAnnouncementEditorOpen: boolean;
  onEditAnnouncement: () => void;
  onToggleMenu: () => void;
}) {
  const { lang, setLang, t } = useLanguage();
  const { logoutSeller } = useSellerSession();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setLanguageOpen(false);
        setAccountOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanguageOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div ref={toolbarRef} className="sellerToolbarWrap">
      <DkToolbar className="sellerTopToolbar" aria-label="Participant Studio toolbar">
        <DkToolbarGroup position="start" className="sellerToolbarUtility toolbarUtilityGroup">
          <DkIconButton
            href={`/seller/${sellerId}/settings/store`}
            icon={<Settings />}
            label={t("toolbar.openSettings")}
            size="sm"
            variant="glass"
          />
          <div className="sellerToolbarPopover">
            <DkIconButton
              icon={<span className="sellerLanguageCode">{lang.toUpperCase()}</span>}
              label={t("toolbar.changeLanguage")}
              size="sm"
              variant="glass"
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              onClick={() => {
                setLanguageOpen((open) => !open);
                setAccountOpen(false);
              }}
            />
            {languageOpen && (
              <div className="sellerToolbarMenu sellerLanguageMenu" role="menu">
                {languageOrder.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="menuitemradio"
                    aria-checked={option === lang}
                    onClick={() => {
                      setLang(option);
                      setLanguageOpen(false);
                    }}
                  >
                    {option.toUpperCase()}
                    {option === lang && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DkToolbarGroup>

        <DkToolbarGroup position="end" className="sellerToolbarPrimary toolbarPrimaryGroup">
          <button
            type="button"
            className={`sellerAnnouncementEditButton${isAnnouncementEditorOpen ? " active" : ""}`}
            aria-pressed={isAnnouncementEditorOpen}
            onClick={() => {
              setLanguageOpen(false);
              setAccountOpen(false);
              onEditAnnouncement();
            }}
          >
            <Megaphone aria-hidden="true" />
            <span>{announcementLabels[lang]}</span>
          </button>
          <DkIconButton
            href="/home#marketplace"
            icon={<Store />}
            label={t("toolbar.openMarket")}
            size="sm"
            variant="glass"
          />
          <div className="sellerToolbarPopover">
            <DkIconButton
              icon={<UserRound />}
              label={t("seller.accountMenu")}
              size="sm"
              variant="glass"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => {
                setAccountOpen((open) => !open);
                setLanguageOpen(false);
              }}
            />
            {accountOpen && (
              <div className="sellerToolbarMenu sellerAccountQuickMenu" role="menu">
                <Link href={`/seller/${sellerId}/profile`} role="menuitem">
                  {t("seller.profile")}
                </Link>
                <button type="button" role="menuitem" onClick={logoutSeller}>
                  {t("toolbar.signOut")}
                </button>
              </div>
            )}
          </div>
          <DkIconButton
            icon={<Menu />}
            label={t("toolbar.openMenu")}
            size="sm"
            variant="glass"
            aria-expanded={isMenuOpen}
            aria-controls="seller-navigation"
            onClick={onToggleMenu}
          />
        </DkToolbarGroup>
      </DkToolbar>
    </div>
  );
}
