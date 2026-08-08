export type RegisteredPageType =
  | "home" | "landing" | "product" | "product_category" | "design_workspace"
  | "project" | "shopping_cart" | "checkout" | "knowledge_article" | "blog"
  | "user_profile" | "organization" | "dashboard" | "settings" | "administration"
  | "reports" | "search_results" | "support" | "help" | "not_found";

export type PageContextEntity = {
  id?: string; type: "product" | "project" | "article" | "user" | "organization" | "report" | "order" | "category" | string;
  displayName: string; summary?: string; status?: string; visibility: "public" | "authenticated" | "participant" | "admin";
  owner?: { displayName: string };
};
export type PageContextAction = {
  id: string; label: string; capability: string; kind: "open" | "edit" | "delete" | "share" | "duplicate" | "export" | "download" | "compare" | "purchase" | "publish" | "archive";
  target?: string; consequential?: boolean;
};
export type PageContextSection = { id: string; title: string; summary?: string; content?: string; itemCount?: number; readingOrder: number };
export type PageContextWorkspace = { id?: string; name: string; currentTool?: string; currentSelection?: string; zoomLevel?: number; editingMode: string; readOnly: boolean };
export type PageContextNavigation = { currentBreadcrumb?: string; previousPage?: string; parentPage?: string; currentModule?: string; currentSection?: string };
export type PageContextSearch = { text: string; filters: Record<string, string | string[]>; sort?: string; currentPage: number; resultCount: number };
export type PageContextSelection = { id?: string; type: string; displayName: string } | null;
export type PageContextMetadataValue = string | number | boolean | null;

export type PageContext = {
  pageId: string; pageType: RegisteredPageType; route: string; title: string; subtitle?: string; description?: string;
  language: "ar" | "en" | "fr" | "de"; direction: "rtl" | "ltr"; breadcrumbs: { label: string; route?: string }[];
  entity?: PageContextEntity; actions: PageContextAction[]; permissions: Record<string, boolean>; workspace?: PageContextWorkspace;
  navigation: PageContextNavigation; metadata: Record<string, PageContextMetadataValue>; visibleSections: PageContextSection[];
  selectedObject: PageContextSelection; search?: PageContextSearch; filters: Record<string, string | string[]>; sort?: string;
  summary: string[]; createdAt: string; updatedAt: string;
};

export type ContextSnapshot = Readonly<PageContext & {
  snapshotId: string; version: number; fingerprint: string;
}>;

export type PageContextInput = Partial<Omit<PageContext, "pageId" | "pageType" | "route" | "language" | "direction" | "createdAt" | "updatedAt" | "summary">> & {
  route: string; language: PageContext["language"]; pageType?: RegisteredPageType; title?: string;
};

export type PageRegistration = {
  id: string; type: RegisteredPageType; title: Record<PageContext["language"], string>;
  match(route: string): boolean; defaultActions?: PageContextAction[];
};

export type ContextChangeKind = "ContextLoaded" | "ContextUpdated" | "ContextChanged" | "EntityChanged" | "SelectionChanged" | "WorkspaceChanged" | "PermissionChanged" | "RouteChanged";
export type ContextChangeEvent = { type: ContextChangeKind; current: ContextSnapshot; previous?: ContextSnapshot; changedFields: string[]; occurredAt: string };
