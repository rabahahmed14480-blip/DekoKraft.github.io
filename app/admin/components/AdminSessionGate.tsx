"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_SHARED_SESSION_COOKIE,
  parseCurrentUserSession,
  serializeCurrentUserSession,
} from "../../../lib/auth/sessionTypes";

export default function AdminSessionGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== "development");
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      document.cookie = `${ADMIN_SESSION_COOKIE}=${serializeCurrentUserSession({ role: "admin", name: "DekoKraft Admin" })}; Path=/; SameSite=Lax`;
      const legacyPrefix = `${LEGACY_SHARED_SESSION_COOKIE}=`;
      const legacyValue = document.cookie
        .split("; ")
        .find((item) => item.startsWith(legacyPrefix))
        ?.slice(legacyPrefix.length);
      if (parseCurrentUserSession(legacyValue)?.role === "admin") {
        document.cookie = `${LEGACY_SHARED_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
      }
    }
    setReady(true);
  }, []);
  return ready ? children : <main className="adminGuardLoading">جاري تهيئة جلسة المدير...</main>;
}
