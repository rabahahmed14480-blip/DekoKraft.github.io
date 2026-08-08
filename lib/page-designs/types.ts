export type PageDesignSource = "admin" | "participant";
export type PageDesignStatus =
  | "draft"
  | "testing"
  | "failed"
  | "awaiting_approval"
  | "approved"
  | "published"
  | "rolled_back"
  | "saved"
  | "snapshot"
  | "archived";
export type DesignAiState =
  | "disabled"
  | "ready"
  | "analyzing"
  | "proposal_ready"
  | "applying"
  | "testing"
  | "awaiting_approval"
  | "failed";
export type DesignTestState = "not_run" | "running" | "passed" | "failed" | "skipped";

export type PageDesignFile = { path: string; content: string };
export type TestResult = {
  id: string;
  name: string;
  required: boolean;
  state: DesignTestState;
  startedAt?: string;
  finishedAt?: string;
  summary: string;
  error?: string;
};
export type DesignProposal = {
  id: string;
  designId: string;
  prompt: string;
  summary: string;
  status:
    | "proposed"
    | "approved_to_apply"
    | "applying"
    | "applied"
    | "test_failed"
    | "awaiting_approval"
    | "approved"
    | "rejected"
    | "rolled_back";
  filesAffected: string[];
  componentsAffected: string[];
  risks: string[];
  requiredTests: string[];
  createdAt: string;
  appliedAt?: string;
  testResults?: TestResult[];
  rollbackSnapshotId?: string;
  proposedFiles?: PageDesignFile[];
};
export type DesignVersionTrigger =
  | "created"
  | "manual_save"
  | "ai_apply"
  | "pre_test"
  | "pre_publish"
  | "publish"
  | "rollback"
  | "restore";
export type DesignVersion = {
  id: string;
  designId: string;
  versionNumber: number;
  label: string;
  sourceVersion?: string;
  createdAt: string;
  createdBy: string;
  trigger: DesignVersionTrigger;
  configurationSnapshot: {
    files: PageDesignFile[];
    layoutNotes: string;
  };
  filesAffected?: string[];
  proposalId?: string;
  testSummary?: string;
};
export type DesignReview = {
  reviewer: string;
  timestamp: string;
  decision: "approved" | "rejected" | "changes_requested";
  notes?: string;
};
export type PublishRecord = {
  publishedAt: string;
  publishedBy: string;
  versionId: string;
  prePublishVersionId: string;
  productionFingerprint: string;
  status: "published" | "failed" | "rolled_back";
  error?: string;
};
export type PageDesign = {
  id: string;
  name: string;
  sourcePage: PageDesignSource;
  status: PageDesignStatus;
  createdAt: string;
  updatedAt: string;
  files: PageDesignFile[];
  baselineFiles: PageDesignFile[];
  sourceFingerprint: string;
  settings: { layoutNotes: string; echoBrainSandbox: boolean };
  aiState: DesignAiState;
  proposals: DesignProposal[];
  tests: TestResult[];
  versions: DesignVersion[];
  reviews: DesignReview[];
  publishRecords: PublishRecord[];
  activeProposalId?: string;
  snapshotWeek?: string;
};
export type PageDesignLibrary = { version: 2; designs: PageDesign[] };

export const pageDesignPermissions = [
  "page_designs.view",
  "page_designs.create",
  "page_designs.edit",
  "page_designs.use_ai",
  "page_designs.test",
  "page_designs.review",
  "page_designs.approve",
  "page_designs.publish",
  "page_designs.rollback",
  "page_designs.archive",
  "page_designs.manage_snapshots",
] as const;
export type PageDesignPermission = (typeof pageDesignPermissions)[number];
