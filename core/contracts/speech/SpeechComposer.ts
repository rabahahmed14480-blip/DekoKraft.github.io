import type { SpeechDocument } from "./SpeechDocument";

export interface SpeechComposer {
  compose(text: string, language: string, voiceId: string): Promise<SpeechDocument>;
}
