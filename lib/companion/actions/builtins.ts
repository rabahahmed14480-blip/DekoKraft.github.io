import type { ActionParameters, ExecutionResult, RegisteredAction } from "./types.ts";

const route = (value: unknown) => typeof value === "string" && /^\/[a-z0-9\-._~/%?=&]*$/i.test(value) && !/\/(?:private|internal|secrets?)(?:\/|$)/i.test(value);
const target = (parameters: ActionParameters) => route(parameters.target);
const success = (message: string, output: Record<string, string | number | boolean | null>): Omit<ExecutionResult, "requestId" | "actionId" | "durationMs" | "completedAt"> => ({ status: "success", success: true, message, output });
const navigation = (identifier: string, category: RegisteredAction["category"], defaultTarget?: string, pages: RegisteredAction["supportedPageTypes"] = "*"): RegisteredAction => ({
  identifier, category, requiredPermissions: [], supportedPageTypes: pages, confirmationPolicy: "never",
  validateParameters: parameters => defaultTarget ? Object.keys(parameters).length === 0 || target(parameters) : target(parameters),
  executor: async request => success("Navigation is ready.", { directive: "navigate", href: String(request.parameters.target ?? defaultTarget) }),
});
const directive = (identifier: string, category: RegisteredAction["category"], pages: RegisteredAction["supportedPageTypes"] = "*"): RegisteredAction => ({
  identifier, category, requiredPermissions: [], supportedPageTypes: pages, confirmationPolicy: "requested",
  validateParameters: parameters => Object.values(parameters).every(value => typeof value !== "object"),
  executor: async request => success("The action is ready.", { directive: identifier, ...(typeof request.parameters.target === "string" ? { target: request.parameters.target } : {}) }),
});

export const builtinActions: RegisteredAction[] = [
  navigation("OpenPage", "navigation"), navigation("GoHome", "navigation", "/home"), navigation("OpenProfile", "navigation", "/participant"),
  navigation("OpenSettings", "settings", "/participant/settings"), navigation("OpenDashboard", "navigation", "/participant"),
  navigation("OpenCart", "shopping", "/market", ["product", "product_category", "shopping_cart", "checkout"]),
  navigation("OpenCheckout", "shopping", "/checkout", ["product", "shopping_cart", "checkout"]),
  navigation("OpenProduct", "shopping", undefined, ["product", "product_category", "search_results", "shopping_cart"]),
  navigation("OpenDocumentation", "support", "/info/help"),
  directive("StartReading", "reading"), directive("PauseReading", "reading"), directive("ResumeReading", "reading"), directive("StopReading", "reading"), directive("ReadSection", "reading"), directive("ReadSelection", "reading"),
  directive("CompareProducts", "shopping", ["product", "product_category", "search_results", "shopping_cart"]),
  directive("AddToFavorites", "shopping", ["product"]), directive("RemoveFavorite", "shopping", ["product"]),
  directive("OpenProject", "workspace", ["design_workspace", "project"]), directive("FocusObject", "workspace", ["design_workspace", "project"]),
  directive("SelectObject", "workspace", ["design_workspace", "project"]), directive("ZoomToObject", "workspace", ["design_workspace", "project"]),
  directive("OpenLayer", "workspace", ["design_workspace", "project"]), directive("SwitchTool", "workspace", ["design_workspace", "project"]),
  directive("ExplainSection", "support"), directive("HighlightSection", "support"), directive("StartTour", "support"),
  directive("RecommendService", "system"),
];
