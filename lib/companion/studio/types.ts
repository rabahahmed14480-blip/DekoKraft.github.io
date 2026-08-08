export type CompanionTemplateType = "general" | "story" | "educational" | "enterprise" | "marketplace";
export type MarketplaceMetadata = Readonly<{
  slug: string;
  title: string;
  description: string;
  author: string;
  version: string;
  tags: readonly string[];
  license: string;
  visibility: "private" | "unlisted" | "public";
  publishingStatus: "draft" | "pending_review" | "published" | "rejected";
}>;
export type AssistantConfiguration = Readonly<{
  brain: { providerId: string; model?: string };
  skills: readonly string[];
  permissions: readonly string[];
  character: string;
  configuration: Readonly<Record<string, string | number | boolean>>;
}>;
export type AvatarConfiguration = Readonly<{
  avatar: string;
  voice: string;
  expressions: readonly string[];
  animationPresets: readonly string[];
  visualIdentity: Readonly<{ primaryColor: string; accentColor: string; logo?: string }>;
}>;
export type CompanionPackage = Readonly<{
  schemaVersion: 1;
  packageId: string;
  createdAt: string;
  updatedAt: string;
  templateType: CompanionTemplateType;
  brain: AssistantConfiguration["brain"];
  skills: AssistantConfiguration["skills"];
  character: string;
  avatar: string;
  voice: string;
  permissions: AssistantConfiguration["permissions"];
  configuration: AssistantConfiguration["configuration"];
  expressions: AvatarConfiguration["expressions"];
  animationPresets: AvatarConfiguration["animationPresets"];
  visualIdentity: AvatarConfiguration["visualIdentity"];
  metadata: MarketplaceMetadata;
}>;
export type ExportedCompanionPackage = Readonly<{ format: "dekokraft-companion"; version: 1; checksum: string; payload: CompanionPackage }>;
export type SharedCompanionPackage = Readonly<{ packageId: string; shareId: string; visibility: MarketplaceMetadata["visibility"]; createdAt: string }>;

