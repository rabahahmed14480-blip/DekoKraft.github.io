import type { SmartServiceContract, SmartServiceId } from "./types.ts";

export function defineSmartService(input: {
  id: SmartServiceId;
  ar: string; en: string; descriptionAr: string; descriptionEn: string;
  ai?: boolean; analytics?: boolean;
  actions?: SmartServiceContract["actions"];
}): SmartServiceContract {
  return {
    id: input.id,
    name: { ar: input.ar, en: input.en },
    description: { ar: input.descriptionAr, en: input.descriptionEn },
    status: () => input.ai ? "offline" : "online",
    permissions: [
      "smart_services.view",
      ...(input.ai ? ["smart_services.use_ai" as const] : []),
      ...(input.analytics ? ["smart_services.view_analytics" as const] : []),
    ],
    actions: input.actions ?? [],
    history: () => [],
    analytics: () => ({ requests: 0, acceptedSuggestions: 0 }),
    health: () => ({
      score: input.ai ? 45 : 100,
      state: input.ai ? "offline" : "online",
      checkedAt: new Date().toISOString(),
      details: input.ai
        ? ["Typed adapter ready", "Callable AI backend unavailable"]
        : ["Service contract healthy"],
    }),
    settings: { advisoryOnly: true, autoPublish: false },
  };
}
