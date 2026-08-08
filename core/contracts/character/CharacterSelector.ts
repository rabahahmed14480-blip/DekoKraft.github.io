import type { CharacterProfile } from "./CharacterProfile";

export interface CharacterSelector {
  select(companionId: string, preferences: Readonly<Record<string, unknown>>): Promise<CharacterProfile>;
}
