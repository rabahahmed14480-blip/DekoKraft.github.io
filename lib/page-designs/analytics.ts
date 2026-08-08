import "server-only";

export type PageDesignEvent =
  | "design_workspace_opened" | "ai_enabled" | "ai_request_submitted"
  | "proposal_received" | "proposal_applied" | "tests_started"
  | "tests_passed" | "tests_failed" | "approval_requested"
  | "design_approved" | "design_rejected" | "publish_started"
  | "publish_succeeded" | "publish_failed" | "rollback_started"
  | "rollback_completed" | "version_restored";

export function trackPageDesignEvent(
  event: PageDesignEvent,
  metadata: { designId: string; sourcePage?: string; version?: number },
) {
  // The repository has no production analytics client. Keep the boundary
  // server-only and intentionally exclude prompts, source, and credentials.
  console.info("[page-designs]", event, metadata);
}
