import "server-only";
import type { DesignProposal, PageDesign } from "./types";
import type { DesignScope } from "./networkTypes";
import { echoBrainDesignAvailability } from "./echobrainStatus";

export type EchoBrainDesignRequest = {
  design: PageDesign;
  prompt: string;
  targetScope: DesignScope;
  calculatedImpact: {
    affectedParticipantCount: number;
    affectedPages: string[];
    affectedSections: string[];
    inheritanceLevel: string;
    rollbackTarget: string;
  };
};
export type EchoBrainDesignProposal = Omit<
  DesignProposal,
  "id" | "designId" | "createdAt" | "status"
>;

export const echoBrainDesignAdapter = {
  available: echoBrainDesignAvailability.available,
  async analyze(request: EchoBrainDesignRequest): Promise<EchoBrainDesignProposal> {
    void request;
    throw new Error("ECHOBRAIN_DESIGN_BACKEND_UNAVAILABLE");
  },
};
