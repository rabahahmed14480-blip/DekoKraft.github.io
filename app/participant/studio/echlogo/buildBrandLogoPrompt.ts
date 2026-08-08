export type BrandProfile = {
  brandName: string;
  businessActivity: string;
  customActivity?: string;
  brandDescription: string;
};

export type BrandLogoPrompt = {
  subject: string;
  industry: string;
  description: string;
  positivePrompt: string;
  negativePrompt: string;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

export function buildBrandLogoPrompt(
  profile: BrandProfile,
): BrandLogoPrompt {
  const subject = clean(profile.brandName);
  const customActivity = clean(profile.customActivity);
  const industry =
    profile.businessActivity === "أخرى" && customActivity
      ? customActivity
      : clean(profile.businessActivity);
  const description = clean(profile.brandDescription);
  const descriptionLine = description
    ? ` Brand description: "${description}".`
    : "";

  return {
    subject,
    industry,
    description,
    positivePrompt:
      `Create a professional, distinctive and scalable logo for the brand "${subject}", operating in "${industry}".` +
      descriptionLine +
      " The logo must be clean, memorable, suitable for commercial use, readable at small sizes, and usable on packaging, social media, websites and printed materials. Use a balanced composition, clear visual hierarchy and a simple background.",
    negativePrompt:
      "photorealistic scene, mockup, watermark, random text, illegible letters, complex background, clutter, low resolution, distorted logo, multiple unrelated symbols",
  };
}
