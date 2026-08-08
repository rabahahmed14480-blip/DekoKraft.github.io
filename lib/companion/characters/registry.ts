import type { CharacterProfile } from "./types.ts";

const identifierPattern = /^[a-z][a-z0-9.-]{2,79}$/;
const versionPattern = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i;

export class CharacterRegistry {
  private profiles = new Map<string, CharacterProfile>();
  private disabled = new Set<string>();

  register(profile: CharacterProfile) {
    const { metadata } = profile;
    if (!identifierPattern.test(metadata.identifier)) throw new Error("INVALID_CHARACTER_IDENTIFIER");
    if (!versionPattern.test(metadata.version)) throw new Error("INVALID_CHARACTER_VERSION");
    if (this.profiles.has(metadata.identifier)) throw new Error("CHARACTER_ALREADY_REGISTERED");
    if (![profile.professionalism, profile.humorLevel, profile.empathyLevel].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error("INVALID_CHARACTER_LEVEL");
    if (!Number.isFinite(profile.speechPacing) || profile.speechPacing < 0.5 || profile.speechPacing > 2) throw new Error("INVALID_CHARACTER_SPEECH_PACING");
    this.profiles.set(metadata.identifier, structuredClone(profile));
    this.disabled.delete(metadata.identifier);
    return this.get(metadata.identifier)!;
  }

  unregister(identifier: string) { this.disabled.delete(identifier); return this.profiles.delete(identifier); }
  enable(identifier: string) { if (!this.profiles.has(identifier)) return false; this.disabled.delete(identifier); return true; }
  disable(identifier: string) { if (!this.profiles.has(identifier)) return false; this.disabled.add(identifier); return true; }
  isEnabled(identifier: string) { return this.profiles.has(identifier) && !this.disabled.has(identifier); }
  get(identifier: string) { const profile = this.profiles.get(identifier); return profile ? structuredClone(profile) : undefined; }
  getEnabled(identifier: string) { return this.isEnabled(identifier) ? this.get(identifier) : undefined; }
  list() { return [...this.profiles.values()].map(profile => structuredClone(profile)); }
  listCharacters() { return this.list().map(profile => ({ profile, enabled: this.isEnabled(profile.metadata.identifier) })); }
}
