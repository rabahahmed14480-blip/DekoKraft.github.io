"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "../LanguageProvider";
import { PageContextResolver } from "../../../lib/companion/page-context/resolver";
import type { ContextSnapshot } from "../../../lib/companion/page-context/types";

const PageContextState = createContext<ContextSnapshot | null>(null);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const resolver = useMemo(() => new PageContextResolver(), []);
  const [query, setQuery] = useState("");
  useEffect(() => { setQuery(window.location.search.slice(1)); }, [pathname]);
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const route = `${pathname || "/"}${query ? `?${query}` : ""}`;
  const snapshot = useMemo(() => resolver.resolve({
    route, language: lang, permissions: {},
    search: params.has("q") ? { text: params.get("q") ?? "", filters: {}, currentPage: Math.max(1, Number(params.get("page") ?? 1) || 1), resultCount: 0, sort: params.get("sort") ?? undefined } : undefined,
    metadata: { source: "registered-route" },
  }), [lang, params, resolver, route]);
  useEffect(() => { document.documentElement.dataset.pageContextType = snapshot.pageType; return () => { delete document.documentElement.dataset.pageContextType; }; }, [snapshot.pageType]);
  return <PageContextState.Provider value={snapshot}>{children}</PageContextState.Provider>;
}

export function usePageContextSnapshot() {
  const snapshot = useContext(PageContextState);
  if (!snapshot) throw new Error("usePageContextSnapshot must be used inside PageContextProvider");
  return snapshot;
}
