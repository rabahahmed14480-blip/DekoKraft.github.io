import type { ActionContext, RegisteredAction } from "./types.ts";

export class PermissionValidator {
  validate(action: RegisteredAction, context: ActionContext) {
    if (action.supportedPageTypes !== "*" && !action.supportedPageTypes.includes(context.page.pageType)) return { allowed: false as const, status: "not_available" as const, message: "This action is not available on the current page." };
    const missing = action.requiredPermissions.filter(permission => !context.permissions.includes(permission));
    if (missing.length) return { allowed: false as const, status: "permission_denied" as const, message: "You do not have permission to perform this action." };
    return { allowed: true as const };
  }
}
