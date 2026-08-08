import { echoBrainDesignAvailability } from "../../page-designs/echobrainStatus.ts";
import type { EchoBrainReasoningProvider, ReasoningResponse } from "./types.ts";

export class EchoBrainAdapter implements EchoBrainReasoningProvider {
  readonly id = "echobrain";
  readonly available = echoBrainDesignAvailability.available;
  async reason(): Promise<ReasoningResponse> {
    if (!this.available) throw new Error(echoBrainDesignAvailability.reason);
    throw new Error("ECHOBRAIN_CONVERSATION_ADAPTER_NOT_CONFIGURED");
  }
}
