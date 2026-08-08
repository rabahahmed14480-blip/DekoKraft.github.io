import type { SpeechDocument } from "./SpeechDocument";

export interface SpeechPlayer {
  play(document: SpeechDocument): Promise<void>;
}
