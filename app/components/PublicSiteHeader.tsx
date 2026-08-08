"use client";

import { useEffect, useState } from "react";
import type { AnnouncementPayload } from "../../lib/announcements/types";
import { useLanguage } from "./LanguageProvider";
import AnnouncementBar from "./AnnouncementBar";
import PublicHeader from "./PublicHeader";

export default function PublicSiteHeader({
  showNotificationBar = true,
  showHeader = true,
  showFloatingToolbar = true,
}: {
  showNotificationBar?: boolean;
  showHeader?: boolean;
  showFloatingToolbar?: boolean;
}) {
  const { lang } = useLanguage();
  const [mainAnnouncement, setMainAnnouncement] =
    useState<AnnouncementPayload | null>(null);
  const [mainAnimationRevision, setMainAnimationRevision] = useState(0);

  useEffect(() => {
    let active = true;
    void fetch("/api/announcement/main", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("main-announcement-load-failed");
        return response.json() as Promise<{
          active: AnnouncementPayload | null;
        }>;
      })
      .then((record) => {
        if (!active) return;
        setMainAnnouncement(record.active);
        setMainAnimationRevision((value) => value + 1);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="publicSiteChrome">
      {showNotificationBar && mainAnnouncement && (
        <AnnouncementBar
          lang={lang}
          announcement={mainAnnouncement}
          animationRevision={mainAnimationRevision}
        />
      )}
      {showHeader && (
        <PublicHeader showFloatingToolbar={showFloatingToolbar} />
      )}
    </div>
  );
}
