export type DesignNetworkNodeType =
  | "platform_root" | "admin_page" | "participant_page"
  | "participant_group" | "participant" | "design_workspace"
  | "saved_design" | "snapshot" | "component";
export type DesignNetworkNodeStatus =
  | "active" | "draft" | "testing" | "approved"
  | "published" | "archived" | "disabled";
export type DesignNetworkNode = {
  id: string;
  type: DesignNetworkNodeType;
  name: string;
  parentId?: string;
  sourceVersionId?: string;
  status: DesignNetworkNodeStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};
export type DesignNetworkRelation =
  | "inherits_from" | "overrides" | "designed_in" | "published_to"
  | "backed_up_by" | "restored_from" | "contains_component";
export type DesignNetworkEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: DesignNetworkRelation;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
export type PageSectionId =
  | "toolbar" | "header" | "announcement" | "navigation" | "cards"
  | "profile" | "dialogs" | "layout" | "colors" | "typography";
export type SectionOverride = {
  enabled: boolean;
  componentVersionId?: string;
  settings?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  hidden?: boolean;
};
export type SectionConfiguration = Record<PageSectionId, SectionOverride>;
export type ParticipantDesignOverride = {
  id: string;
  participantId: string;
  sourcePage: "participant";
  baseVersionId: string;
  designId?: string;
  enabled: boolean;
  sections: Partial<SectionConfiguration>;
  version: number;
  history: ParticipantOverrideSnapshot[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};
export type ParticipantOverrideSnapshot = {
  id: string;
  version: number;
  sections: Partial<SectionConfiguration>;
  createdAt: string;
  createdBy: string;
  trigger: "publish" | "rollback" | "return_global";
};
export type ParticipantGroup = {
  id: string;
  name: string;
  kind: "organization" | "cohort";
  priority: number;
  memberIds: string[];
  sections: Partial<SectionConfiguration>;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type DesignScopeType =
  | "admin_page" | "participant_global" | "participant_group"
  | "participant" | "section";
export type DesignScope = {
  type: DesignScopeType;
  participantId?: string;
  groupId?: string;
  sectionIds: PageSectionId[];
  impactConfirmed: boolean;
};
export type DesignWorkspaceOverride = {
  designId: string;
  scope: DesignScope;
  baseVersionId: string;
  sections: Partial<SectionConfiguration>;
  updatedAt: string;
};
export type ResolvedPageConfiguration = {
  pageType: "admin" | "participant";
  participantId?: string;
  sections: SectionConfiguration;
  inheritance: string[];
  versionKey: string;
};
export type NetworkAuditEntry = {
  id: string;
  action: string;
  designId?: string;
  participantId?: string;
  groupId?: string;
  inheritedVersion?: string;
  changedSections: PageSectionId[];
  actor: string;
  createdAt: string;
  impactCount: number;
};
export type PartialDesignNetwork = {
  version: 1;
  productionVersion: number;
  nodes: DesignNetworkNode[];
  edges: DesignNetworkEdge[];
  groups: ParticipantGroup[];
  participantOverrides: ParticipantDesignOverride[];
  workspaces: DesignWorkspaceOverride[];
  audit: NetworkAuditEntry[];
};
