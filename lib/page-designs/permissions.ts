import "server-only";
import type { CurrentUserSession } from "../auth/sessionTypes";
import {
  pageDesignPermissions,
  type PageDesignPermission,
} from "./types";

export function pageDesignPermissionSet(session: CurrentUserSession) {
  return new Set<PageDesignPermission>(
    session.role === "admin" ? pageDesignPermissions : [],
  );
}

export function requirePageDesignPermission(
  session: CurrentUserSession,
  permission: PageDesignPermission,
) {
  if (!pageDesignPermissionSet(session).has(permission)) {
    throw new Error("PAGE_DESIGN_PERMISSION_DENIED");
  }
}
