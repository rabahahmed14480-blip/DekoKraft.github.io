import type { BrainRequest } from "./BrainRequest";
import type { BrainResponse } from "./BrainResponse";

export interface BrainReasoner {
  reason(request: BrainRequest): Promise<BrainResponse>;
}
