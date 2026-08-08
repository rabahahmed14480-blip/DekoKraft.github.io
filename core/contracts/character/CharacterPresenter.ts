import type { CharacterProfile } from "./CharacterProfile";

export interface CharacterPresenter {
  present(content: string, character: CharacterProfile): Promise<string>;
}
