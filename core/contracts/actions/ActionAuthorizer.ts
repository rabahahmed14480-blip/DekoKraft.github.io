import type { ActionRequest } from "./ActionRequest";

export interface ActionAuthorizer {
  authorize(action: ActionRequest, permissions: readonly string[]): Promise<boolean>;
}
