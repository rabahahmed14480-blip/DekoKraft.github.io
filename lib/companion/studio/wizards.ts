import type { AssistantConfiguration, AvatarConfiguration } from "./types.ts";

type Draft<T> = { -readonly [Key in keyof T]?: T[Key] };

export class AssistantWizard {
  private draft: Draft<AssistantConfiguration> = {};
  configureBrain(brain: AssistantConfiguration["brain"]) { this.draft.brain = structuredClone(brain); return this; }
  configureSkills(skills: readonly string[]) { this.draft.skills = [...new Set(skills.filter(Boolean))]; return this; }
  configurePermissions(permissions: readonly string[]) { this.draft.permissions = [...new Set(permissions.filter(Boolean))]; return this; }
  configureCharacter(character: string) { this.draft.character = character.trim(); return this; }
  configure(configuration: AssistantConfiguration["configuration"]) { this.draft.configuration = structuredClone(configuration); return this; }
  build(): AssistantConfiguration {
    if (!this.draft.brain?.providerId || !this.draft.character || !this.draft.skills?.length) throw new Error("ASSISTANT_WIZARD_INCOMPLETE");
    return Object.freeze({ brain: structuredClone(this.draft.brain), skills: Object.freeze([...(this.draft.skills ?? [])]), permissions: Object.freeze([...(this.draft.permissions ?? [])]), character: this.draft.character, configuration: Object.freeze({ ...(this.draft.configuration ?? {}) }) });
  }
}

export class AvatarWizard {
  private draft: Draft<AvatarConfiguration> = {};
  configureAvatar(avatar: string) { this.draft.avatar = avatar.trim(); return this; }
  configureVoice(voice: string) { this.draft.voice = voice.trim(); return this; }
  configureExpressions(expressions: readonly string[]) { this.draft.expressions = [...new Set(expressions.filter(Boolean))]; return this; }
  configureAnimations(animationPresets: readonly string[]) { this.draft.animationPresets = [...new Set(animationPresets.filter(Boolean))]; return this; }
  configureVisualIdentity(visualIdentity: AvatarConfiguration["visualIdentity"]) { this.draft.visualIdentity = structuredClone(visualIdentity); return this; }
  build(): AvatarConfiguration {
    if (!this.draft.avatar || !this.draft.voice || !this.draft.visualIdentity?.primaryColor || !this.draft.visualIdentity.accentColor) throw new Error("AVATAR_WIZARD_INCOMPLETE");
    return Object.freeze({ avatar: this.draft.avatar, voice: this.draft.voice, expressions: Object.freeze([...(this.draft.expressions ?? [])]), animationPresets: Object.freeze([...(this.draft.animationPresets ?? [])]), visualIdentity: Object.freeze({ ...this.draft.visualIdentity }) });
  }
}
