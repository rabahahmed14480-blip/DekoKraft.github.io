"use client";

import { useEffect, useState } from "react";
import { cmsTabs, type CmsTabId } from "../config/cmsTabs";
import type { Lang } from "../../../locales";
import { useLanguage } from "../../components/LanguageProvider";
import DekoKraftPageShell from "../../components/DekoKraftPageShell";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { DkBrand, type DkMenuAnchor } from "../../components/ui";
import { publicPath } from "../../lib/publicPath";
import "../admin-v2.css";

import AdminAnnouncementBar from "./AdminAnnouncementBar";
import AdminAnnouncementModal, {
  type AnnouncementMessages,
} from "./AdminAnnouncementModal";
import AdminTopToolbar from "./AdminTopToolbar";
import Sidebar from "./layout/Sidebar";
import AdminFooter from "./layout/AdminFooter";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import AdminToolLauncher from "./AdminToolLauncher";
import ProductModal, {
  type ProductModalSavedProduct,
} from "./products/ProductModal";

const adminAnnouncementMessages: AnnouncementMessages = {
  ar: "مرحبًا بك في لوحة تحكم DekoKraft",
  de: "Willkommen im DekoKraft-Administrationsbereich",
  en: "Welcome to the DekoKraft administration dashboard",
  fr: "Bienvenue dans le tableau de bord administrateur DekoKraft",
};

const adminAnnouncementStorageKey = "dekokraft.admin.announcement";

export default function AdminShell() {
  const [activeTab, setActiveTab] = useState<CmsTabId>("dashboard");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);
  const [lastSavedProduct, setLastSavedProduct] =
    useState<ProductModalSavedProduct | null>(null);
  const [productSaveSuccessMessage, setProductSaveSuccessMessage] =
    useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementMessages, setAnnouncementMessages] =
    useState<AnnouncementMessages>({ ...adminAnnouncementMessages });
  const [sidebarAnchor, setSidebarAnchor] = useState<DkMenuAnchor | null>(null);
  const { lang, setLang, t } = useLanguage();

  const isArabic = lang === "ar";
  const direction = isArabic ? "rtl" : "ltr";
  const active = cmsTabs.find((tab) => tab.id === activeTab);

  const openAddProductForm = () => {
    setActiveTab("products");
    setProductSaveSuccessMessage("");
    setIsProductModalOpen(true);
  };

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(adminAnnouncementStorageKey);
      if (!storedValue?.trim()) return;

      let migratedMessages: AnnouncementMessages;

      try {
        const parsedValue: unknown = JSON.parse(storedValue);

        if (
          parsedValue &&
          typeof parsedValue === "object" &&
          !Array.isArray(parsedValue)
        ) {
          const storedMessages = parsedValue as Partial<Record<Lang, unknown>>;
          migratedMessages = {
            ar: typeof storedMessages.ar === "string" ? storedMessages.ar : "",
            de: typeof storedMessages.de === "string" ? storedMessages.de : "",
            en: typeof storedMessages.en === "string" ? storedMessages.en : "",
            fr: typeof storedMessages.fr === "string" ? storedMessages.fr : "",
          };
        } else {
          migratedMessages = {
            ar: typeof parsedValue === "string" ? parsedValue : storedValue,
            de: "",
            en: "",
            fr: "",
          };
        }
      } catch {
        migratedMessages = {
          ar: storedValue,
          de: "",
          en: "",
          fr: "",
        };
      }

      localStorage.setItem(
        adminAnnouncementStorageKey,
        JSON.stringify(migratedMessages),
      );
      setAnnouncementMessages({
        ar: migratedMessages.ar.trim() || adminAnnouncementMessages.ar,
        de: migratedMessages.de.trim() || adminAnnouncementMessages.de,
        en: migratedMessages.en.trim() || adminAnnouncementMessages.en,
        fr: migratedMessages.fr.trim() || adminAnnouncementMessages.fr,
      });
    } catch {
      // The localized defaults remain available if browser storage is blocked.
    }
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isSidebarOpen]);

  return (
    <DekoKraftPageShell
      className="adminPublicPageFrame"
      bodyClassName="adminPublicPageBody"
      chrome={(
        <div className="publicSiteChrome">
          <AdminAnnouncementBar
            language={lang}
            announcements={announcementMessages}
            direction={direction}
          />
          <header className="publicHeader" dir={direction}>
            <div className="publicHeaderMain publicContentContainer">
              <AdminTopToolbar
                lang={lang}
                setLang={setLang}
                isMenuOpen={isSidebarOpen}
                onEditAnnouncement={() => setIsAnnouncementModalOpen(true)}
                onOpenMainAnnouncement={() => {
                  setActiveTab("offers");
                  setIsSidebarOpen(false);
                }}
                isParticipantAnnouncementActive={isAnnouncementModalOpen}
                isMainAnnouncementActive={activeTab === "offers"}
                onToggleMenu={(anchor) => {
                  setSidebarAnchor(anchor);
                  setIsSidebarOpen((open) => !open);
                }}
              />
            </div>
          </header>
        </div>
      )}
    >
      <main
        className="dkAdminLayout"
        dir="ltr"
        data-dir={direction}
        data-menu-open={isSidebarOpen || undefined}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          isOpen={isSidebarOpen}
          anchor={sidebarAnchor}
          onClose={() => setIsSidebarOpen(false)}
        />
        <section className="dkMain" dir={direction}>
          <DashboardShell
          direction={direction}
          className="adminDashboardShell"
          logo={(
            <DkBrand
              className="dk-brand-heading"
              name={t("header.brand")}
              subtitle={t("header.tagline")}
              mediaSrc="/videos/logo/logo.mp4"
              mediaType="video"
              mediaAlt="DekoKraft animated logo"
              fallbackImageSrc={publicPath("/logo-dekokraft-600.webp")}
            />
          )}
          title={activeTab === "dashboard" ? t("admin.dashboard.pageTitle") : undefined}
          subtitle={activeTab === "dashboard" ? t("admin.dashboard.pageSubtitle") : undefined}
          headerClassName="dkHeader"
          identityClassName="dkHeaderTitle dk-brand-hero"
          headingClassName="dkAdminPageHeading"
          titleClassName="dk-dashboard-title"
          subtitleClassName="dk-admin-subtitle"
          contentClassName="dkContent"
          footer={<AdminFooter lang={lang} version={t("admin.version")} rights={t("admin.rights")} />}
        >
          {activeTab === "dekobrain" && <AdminToolLauncher lang={lang} />}

          {activeTab === "dashboard" && (
            <DashboardPage
              lang={lang}
            />
          )}

          {activeTab === "products" && (
            <ProductsPage
              lang={lang}
              onAddProduct={openAddProductForm}
              refreshKey={productsRefreshKey}
              savedProduct={lastSavedProduct}
              saveSuccessMessage={productSaveSuccessMessage}
            />
          )}

          {activeTab !== "dashboard" && activeTab !== "products" && activeTab !== "dekobrain" && (
            <section className="dkHeroCard">
              <h2>
                {active?.icon} {t(`admin.sidebar.${activeTab}`)}
              </h2>

              <p>{t("admin.readySection")}</p>
            </section>
          )}
          </DashboardShell>
        </section>

        <ProductModal
          open={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSaved={(product, successMessage) => {
            setLastSavedProduct(product);
            setProductSaveSuccessMessage(successMessage);
            setProductsRefreshKey((current) => current + 1);
          }}
          lang={lang}
        />
        {isAnnouncementModalOpen && (
          <AdminAnnouncementModal
            lang={lang}
            messages={announcementMessages}
            onCancel={() => setIsAnnouncementModalOpen(false)}
            onPreview={(messages) => {
              const completeMessages: AnnouncementMessages = {
                ar: messages.ar.trim() || adminAnnouncementMessages.ar,
                de: messages.de.trim() || adminAnnouncementMessages.de,
                en: messages.en.trim() || adminAnnouncementMessages.en,
                fr: messages.fr.trim() || adminAnnouncementMessages.fr,
              };
              localStorage.setItem(
                adminAnnouncementStorageKey,
                JSON.stringify(completeMessages),
              );
              setAnnouncementMessages(completeMessages);
              setIsAnnouncementModalOpen(false);
            }}
            onRestoreDefault={() => {
              localStorage.removeItem(adminAnnouncementStorageKey);
              setAnnouncementMessages({ ...adminAnnouncementMessages });
              setIsAnnouncementModalOpen(false);
            }}
          />
        )}
      </main>
    </DekoKraftPageShell>
  );
}
