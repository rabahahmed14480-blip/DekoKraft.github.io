import { CharacterEngine } from "./engine.ts";
import { builtinCharacters } from "./profiles.ts";
import { CharacterRegistry } from "./registry.ts";
import type { CharacterContext, CharacterProfile, CharacterUserPreferences, SemanticResponse } from "./types.ts";

export class CompanionCharacterFramework {
  readonly registry: CharacterRegistry;
  readonly engine: CharacterEngine;
  private selections = new Map<string, CharacterUserPreferences>();
  readonly defaultCharacterId: string;

  constructor(input: { profiles?: CharacterProfile[]; defaultCharacterId?: string } = {}) {
    this.registry = new CharacterRegistry();
    for (const profile of input.profiles ?? builtinCharacters) this.registry.register(profile);
    this.engine = new CharacterEngine();
    this.defaultCharacterId = input.defaultCharacterId ?? "professional";
    if (!this.registry.getEnabled(this.defaultCharacterId)) throw new Error("DEFAULT_CHARACTER_NOT_REGISTERED");
  }

  register(profile: CharacterProfile) { return this.registry.register(profile); }
  unregister(identifier: string) {
    if (identifier === this.defaultCharacterId) throw new Error("DEFAULT_CHARACTER_CANNOT_BE_UNREGISTERED");
    return this.registry.unregister(identifier);
  }
  enable(identifier: string) { return this.registry.enable(identifier); }
  disable(identifier: string) {
    if (identifier === this.defaultCharacterId) throw new Error("DEFAULT_CHARACTER_CANNOT_BE_DISABLED");
    return this.registry.disable(identifier);
  }
  listCharacters() { return this.registry.listCharacters(); }

  select(sessionId: string, preferences: CharacterUserPreferences) {
    const identifier = preferences.characterId ?? this.defaultCharacterId;
    if (!this.registry.getEnabled(identifier)) throw new Error("CHARACTER_NOT_AVAILABLE");
    this.selections.set(sessionId, structuredClone({ ...preferences, characterId: identifier }));
    return this.current(sessionId);
  }
  switchCharacter(sessionId: string, characterId: string, preferences: Omit<CharacterUserPreferences, "characterId"> = {}) {
    return this.select(sessionId, { ...preferences, characterId });
  }

  current(sessionId: string) {
    const preferences = this.selections.get(sessionId) ?? { characterId: this.defaultCharacterId };
    const profile = this.registry.getEnabled(preferences.characterId ?? this.defaultCharacterId);
    if (!profile) throw new Error("CHARACTER_NOT_AVAILABLE");
    return { profile, preferences: structuredClone(preferences) };
  }

  transform(sessionId: string, semantic: SemanticResponse, context: Omit<CharacterContext, "sessionId" | "userPreferences">) {
    const { profile, preferences } = this.current(sessionId);
    return this.engine.transform(semantic, profile, { ...context, sessionId, userPreferences: preferences });
  }

  clearSession(sessionId: string) { this.selections.delete(sessionId); }
}

export { CompanionCharacterFramework as CharacterFramework };
