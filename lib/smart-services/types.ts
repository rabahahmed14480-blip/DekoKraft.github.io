import type { CurrentUserSession } from "../auth/sessionTypes";
import type { ResolvedPageConfiguration } from "../page-designs/networkTypes";

export type SmartServiceId =
  | "notifications" | "updates" | "ai-status" | "smart-product-form"
  | "page-interfaces" | "ai-companion" | "marketing-assistant"
  | "content-assistant" | "design-assistant" | "analytics-assistant";
export type SmartServiceStatus = "online" | "offline" | "degraded" | "coming_soon";
export type SmartServicePermission =
  | "smart_services.view" | "smart_services.use_ai" | "smart_services.edit"
  | "smart_services.manage_interfaces" | "smart_services.view_analytics";
export type SmartServiceAction = {
  id: string; label: string; kind: "read" | "suggest" | "draft" | "request";
  permission: SmartServicePermission; autoPublishes: false;
};
export type SmartServiceHistoryEntry = {
  id: string; event: string; createdAt: string; actor: string; metadata?: Record<string, unknown>;
};
export type SmartServiceHealth = {
  score: number; state: SmartServiceStatus; checkedAt: string; details: string[];
};
export type SmartServiceContext = {
  session: CurrentUserSession;
  participantId?: string;
  resolvedConfiguration: ResolvedPageConfiguration;
};
export type SmartServiceContract = {
  id: SmartServiceId;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  status(context: SmartServiceContext): SmartServiceStatus;
  permissions: SmartServicePermission[];
  actions: SmartServiceAction[];
  history(context: SmartServiceContext): SmartServiceHistoryEntry[];
  analytics(context: SmartServiceContext): Record<string, number>;
  health(context: SmartServiceContext): SmartServiceHealth;
  settings: Record<string, unknown>;
};
export type InterfaceCategory =
  | "current" | "free" | "new" | "recommended" | "private" | "purchased" | "requested";
export type PageInterface = {
  id: string; name: string; category: InterfaceCategory; sourceDesignId: string;
  versionId?: string; ownerParticipantId?: string; previewAvailable: boolean;
  activationStatus: "inactive" | "pending_approval" | "active";
  createdAt: string; updatedAt: string;
};
