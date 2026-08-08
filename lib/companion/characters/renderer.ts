import type { CharacterContext, CharacterProfile, CharacterResponse, SemanticResponse } from "./types.ts";

const leads: Record<CharacterProfile["tone"], Record<CharacterContext["language"], string>> = {
  professional: { ar: "بكل تأكيد.", en: "Certainly.", fr: "Certainement.", de: "Gerne." },
  friendly: { ar: "يسعدني مساعدتك.", en: "Happy to help.", fr: "Avec plaisir.", de: "Sehr gern." },
  creative: { ar: "من منظور التصميم،", en: "From a design perspective,", fr: "Du point de vue du design,", de: "Aus Designperspektive," },
  educational: { ar: "دعنا نشرحها خطوة بخطوة.", en: "Let’s work through it.", fr: "Voyons cela étape par étape.", de: "Gehen wir es Schritt für Schritt durch." },
  minimal: { ar: "", en: "", fr: "", de: "" },
  persuasive: { ar: "الخيار العملي هنا:", en: "A practical option:", fr: "Une option pratique :", de: "Eine praktische Option:" },
};

export class CharacterRenderer {
  render(semantic: SemanticResponse, profile: CharacterProfile, context: CharacterContext): Pick<CharacterResponse, "text" | "tone" | "responseStyle" | "speechPacing" | "speechPauses" | "emojiPolicy" | "voiceBinding" | "avatarBinding"> {
    const lead = context.userPreferences.disableConversationalLead ? "" : leads[profile.tone][context.language];
    return {
      text: lead ? `${lead}\n\n${semantic.text}` : semantic.text,
      tone: profile.tone,
      responseStyle: profile.responseStyle,
      speechPacing: profile.speechPacing,
      speechPauses: structuredClone(profile.speechPauses),
      emojiPolicy: profile.emojiPolicy,
      voiceBinding: structuredClone(profile.voiceBinding),
      avatarBinding: profile.avatarBinding,
    };
  }
}
