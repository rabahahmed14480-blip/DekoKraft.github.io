import type { AvatarPreview, AvatarProfile } from "./types.ts";

const identifierPattern = /^[a-z][a-z0-9.-]{2,79}$/;

export class AvatarRegistry {
  private profiles = new Map<string, AvatarProfile>();
  private loaded = new Set<string>();

  register(profile: AvatarProfile) {
    if (!identifierPattern.test(profile.identifier)) throw new Error("INVALID_AVATAR_IDENTIFIER");
    if (this.profiles.has(profile.identifier)) throw new Error("AVATAR_ALREADY_REGISTERED");
    if (!profile.animationSet.length || !profile.supportedExpressions.length) throw new Error("INVALID_AVATAR_PROFILE");
    this.profiles.set(profile.identifier, structuredClone(profile));
    return this.get(profile.identifier)!;
  }

  unregister(identifier: string) { this.loaded.delete(identifier); return this.profiles.delete(identifier); }
  load(identifier: string) { if (!this.profiles.has(identifier)) throw new Error("AVATAR_NOT_FOUND"); this.loaded.add(identifier); return this.get(identifier)!; }
  unload(identifier: string) { return this.loaded.delete(identifier); }
  isLoaded(identifier: string) { return this.loaded.has(identifier); }
  get(identifier: string) { const profile = this.profiles.get(identifier); return profile ? structuredClone(profile) : undefined; }
  list() { return [...this.profiles.values()].map(profile => structuredClone(profile)); }
  preview(identifier: string): AvatarPreview {
    const profile = this.get(identifier);
    if (!profile) throw new Error("AVATAR_NOT_FOUND");
    return { identifier, displayName: profile.displayName, kind: profile.kind, renderQuality: profile.renderQuality, loaded: this.isLoaded(identifier) };
  }
}

