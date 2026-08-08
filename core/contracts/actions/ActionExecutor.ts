import type { ActionRequest } from "./ActionRequest";
import type { ActionResult } from "./ActionResult";

export interface ActionExecutor {
  execute(action: ActionRequest): Promise<ActionResult>;
}
