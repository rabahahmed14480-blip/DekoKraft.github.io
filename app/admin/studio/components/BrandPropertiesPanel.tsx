"use client";

import { useEffect, useState } from "react";
import {
  buildBrandLogoPrompt,
  type BrandLogoPrompt,
} from "../../../participant/studio/echlogo/buildBrandLogoPrompt";
import styles from "./BrandPropertiesPanel.module.css";

export type BrandProfile = {
  brandName: string;
  businessActivity: string;
  customActivity: string;
  brandDescription: string;
};

type SavedBrandProfile = BrandProfile & {
  updatedAt: string;
};

export type BrandGenerationStatus =
  | "idle"
  | "ready"
  | "generating"
  | "success"
  | "error";

export type BrandLogoGenerationDraft = {
  profile: BrandProfile;
  prompt: BrandLogoPrompt;
  status: "ready" | "stale";
  updatedAt: string;
};

type BrandPropertiesPanelProps = {
  initialBrandName?: string;
  onAnalyzeBrand?: (profile: BrandProfile) => void;
  onGenerateBrandLogo?: (draft: BrandLogoGenerationDraft) => Promise<void>;
};

const BRAND_PROFILE_STORAGE_KEY = "dekokraft-brand-profile";
const BRAND_LOGO_DRAFT_STORAGE_KEY =
  "dekokraft-brand-logo-generation-draft";

const businessActivities = [
  "الحرف اليدوية",
  "التطريز",
  "الطباعة",
  "النقش بالليزر",
  "الخياطة",
  "صناعة المجوهرات",
  "الديكور",
  "الأثاث",
  "التصوير",
  "المخبوزات",
  "مستحضرات التجميل",
  "التجارة الإلكترونية",
  "الخدمات",
  "التعليم",
  "التقنية",
  "أخرى",
] as const;

function loadBrandProfile(initialBrandName: string): BrandProfile {
  if (typeof window === "undefined") {
    return {
      brandName: initialBrandName,
      businessActivity: "",
      customActivity: "",
      brandDescription: "",
    };
  }

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(BRAND_PROFILE_STORAGE_KEY) ?? "null",
    ) as Partial<SavedBrandProfile> | null;
    return {
      brandName:
        typeof saved?.brandName === "string"
          ? saved.brandName
          : initialBrandName,
      businessActivity:
        typeof saved?.businessActivity === "string"
          ? saved.businessActivity
          : "",
      customActivity:
        typeof saved?.customActivity === "string" ? saved.customActivity : "",
      brandDescription:
        typeof saved?.brandDescription === "string"
          ? saved.brandDescription
          : "",
    };
  } catch {
    return {
      brandName: initialBrandName,
      businessActivity: "",
      customActivity: "",
      brandDescription: "",
    };
  }
}

function loadGenerationDraft(): BrandLogoGenerationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(BRAND_LOGO_DRAFT_STORAGE_KEY) ?? "null",
    ) as BrandLogoGenerationDraft | null;
    return value?.status === "ready" || value?.status === "stale"
      ? value
      : null;
  } catch {
    return null;
  }
}

export default function BrandPropertiesPanel({
  initialBrandName = "",
  onAnalyzeBrand,
  onGenerateBrandLogo,
}: BrandPropertiesPanelProps) {
  const [profile, setProfile] = useState<BrandProfile>({
    brandName: initialBrandName,
    businessActivity: "",
    customActivity: "",
    brandDescription: "",
  });
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [draft, setDraft] = useState<BrandLogoGenerationDraft | null>(null);
  const [generationStatus, setGenerationStatus] =
    useState<BrandGenerationStatus>("idle");
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const filteredActivities = businessActivities.filter((activity) =>
    activity.includes(activitySearch.trim()),
  );
  const selectedActivityLabel =
    profile.businessActivity === "أخرى" && profile.customActivity.trim()
      ? profile.customActivity
      : profile.businessActivity || "اختر النشاط";

  useEffect(() => {
    setProfile(loadBrandProfile(initialBrandName));
    const savedDraft = loadGenerationDraft();
    setDraft(savedDraft);
    setGenerationStatus(savedDraft?.status === "ready" ? "ready" : "idle");
  }, [initialBrandName]);

  function updateProfile(patch: Partial<BrandProfile>) {
    setProfile((current) => ({ ...current, ...patch }));
    setSaveMessage("");
    setGenerationStatus("idle");
    setDraft((current) => {
      if (!current || current.status === "stale") return current;
      const staleDraft = { ...current, status: "stale" as const };
      window.localStorage.setItem(
        BRAND_LOGO_DRAFT_STORAGE_KEY,
        JSON.stringify(staleDraft),
      );
      return staleDraft;
    });
  }

  function selectActivity(activity: string) {
    updateProfile({
      businessActivity: activity,
      customActivity: activity === "أخرى" ? profile.customActivity : "",
    });
    setActivitySearch("");
    setIsActivityOpen(false);
  }

  function handleAnalyzeBrand() {
    onAnalyzeBrand?.(profile);
  }

  function handleSaveBrandProfile() {
    const brandName = profile.brandName.trim();
    const businessActivity = profile.businessActivity.trim();
    const customActivity = profile.customActivity.trim();
    if (!brandName) {
      setSaveMessage("أدخل اسم العلامة أولًا.");
      return;
    }
    if (!businessActivity || (businessActivity === "أخرى" && !customActivity)) {
      setSaveMessage("اختر نشاط العلامة أولًا.");
      return;
    }
    const normalizedProfile = {
      ...profile,
      brandName,
      businessActivity,
      customActivity,
      brandDescription: profile.brandDescription.trim(),
    };
    const updatedAt = new Date().toISOString();
    const saved: SavedBrandProfile = {
      ...normalizedProfile,
      updatedAt,
    };
    const nextDraft: BrandLogoGenerationDraft = {
      profile: normalizedProfile,
      prompt: buildBrandLogoPrompt(normalizedProfile),
      status: "ready",
      updatedAt,
    };
    window.localStorage.setItem(
      BRAND_PROFILE_STORAGE_KEY,
      JSON.stringify(saved),
    );
    window.localStorage.setItem(
      BRAND_LOGO_DRAFT_STORAGE_KEY,
      JSON.stringify(nextDraft),
    );
    setProfile(normalizedProfile);
    setDraft(nextDraft);
    setGenerationStatus("ready");
    setSaveMessage("خصائص العلامة جاهزة للتوليد.");
  }

  async function handleGenerateBrandLogo() {
    if (
      !draft ||
      draft.status !== "ready" ||
      !profile.brandName.trim() ||
      !profile.businessActivity.trim() ||
      generationStatus === "generating"
    ) {
      return;
    }
    setGenerationStatus("generating");
    setSaveMessage("جارٍ توليد الشعار...");
    try {
      await onGenerateBrandLogo?.(draft);
      setGenerationStatus("success");
      setSaveMessage("تم توليد الشعار وتجهيزه داخل مساحة التصميم.");
    } catch (error) {
      setGenerationStatus("error");
      setSaveMessage(
        error instanceof Error ? error.message : "تعذر توليد الشعار.",
      );
    }
  }

  return (
    <section className={styles.panel}>
      <h3>خصائص العلامة التجارية</h3>

      <label>
        اسم العلامة التجارية
        <input
          value={profile.brandName}
          onChange={(event) => updateProfile({ brandName: event.target.value })}
        />
      </label>

      <div className={styles.activity}>
        <button
          type="button"
          aria-expanded={isActivityOpen}
          onClick={() => setIsActivityOpen((current) => !current)}
        >
          {selectedActivityLabel}
        </button>

        {isActivityOpen && (
          <div className={styles.activityList}>
            <input
              className={styles.search}
              value={activitySearch}
              placeholder="ابحث عن نشاط..."
              onChange={(event) => setActivitySearch(event.target.value)}
            />
            {filteredActivities.map((activity) => (
              <button
                type="button"
                key={activity}
                onClick={() => selectActivity(activity)}
              >
                {activity}
              </button>
            ))}
          </div>
        )}
      </div>

      {profile.businessActivity === "أخرى" && (
        <>
          <label>
            اكتب نشاطك
            <input
              value={profile.customActivity}
              onChange={(event) =>
                updateProfile({ customActivity: event.target.value })
              }
            />
          </label>
          <button
            type="button"
            disabled={!profile.customActivity.trim()}
            onClick={() => setSaveMessage("تم اختيار النشاط المخصص.")}
          >
            تأكيد النشاط
          </button>
        </>
      )}

      <label>
        توصيفة النشاط
        <textarea
          value={profile.brandDescription}
          placeholder="اكتب ما تقدمه علامتك، ومن هم عملاؤك، وما الذي يميز منتجاتك..."
          onChange={(event) =>
            updateProfile({ brandDescription: event.target.value })
          }
        />
      </label>

      <button type="button" onClick={handleAnalyzeBrand}>
        تحليل العلامة التجارية
      </button>

      <div className={styles.suggestion}>
        <strong>اقتراح المرافق</strong>
        <p>أدخل نشاط العلامة وتوصيفتها للحصول على اقتراحات ذكية.</p>
      </div>

      <button
        type="button"
        className={styles.primary}
        onClick={handleSaveBrandProfile}
      >
        حفظ خصائص العلامة
      </button>

      <button
        type="button"
        disabled={
          !draft ||
          draft.status !== "ready" ||
          !profile.brandName.trim() ||
          !profile.businessActivity.trim() ||
          generationStatus === "generating"
        }
        onClick={() => void handleGenerateBrandLogo()}
      >
        {generationStatus === "generating"
          ? "جارٍ توليد الشعار..."
          : "توليد شعار من الخصائص"}
      </button>

      {draft?.status === "ready" && (
        <>
          <button
            type="button"
            aria-expanded={isPromptOpen}
            onClick={() => setIsPromptOpen((current) => !current)}
          >
            معاينة التوجيه
          </button>
          {isPromptOpen && (
            <div className={styles.promptPreview}>
              <strong>{draft.profile.brandName}</strong>
              <span>{draft.prompt.industry}</span>
              <p>{draft.profile.brandDescription || "دون توصيفة إضافية"}</p>
              <textarea readOnly value={draft.prompt.positivePrompt} />
            </div>
          )}
        </>
      )}

      {saveMessage && (
        <p className={styles.message} role="status">
          {saveMessage}
        </p>
      )}
    </section>
  );
}
