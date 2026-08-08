import type { SmartServiceContract, SmartServiceId } from "./types.ts";
import { smartServiceModules } from "./services.ts";

class SmartServiceRegistry {
  private services = new Map<SmartServiceId, SmartServiceContract>();
  register(service: SmartServiceContract) {
    if (this.services.has(service.id)) throw new Error(`SMART_SERVICE_DUPLICATE:${service.id}`);
    this.services.set(service.id, service);
  }
  get(id: SmartServiceId) { return this.services.get(id); }
  list() { return [...this.services.values()]; }
}
export const smartServiceRegistry = new SmartServiceRegistry();
for (const service of smartServiceModules) smartServiceRegistry.register(service);
