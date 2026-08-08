import { AvatarEngine } from "./engine.ts";
import { builtinAvatars } from "./profiles.ts";
import { AvatarRegistry } from "./registry.ts";
import { LipSyncEngine } from "./behaviorEngines.ts";
import type { AvatarProfile, AvatarVisualSignal, PhonemeTiming } from "./types.ts";

export class CompanionAvatarFramework {
  readonly registry = new AvatarRegistry();
  readonly engine = new AvatarEngine();
  readonly lipSync = new LipSyncEngine();
  private selections = new Map<string, string>();

  constructor(profiles: AvatarProfile[] = builtinAvatars) { for (const profile of profiles) this.registry.register(profile); }
  register(profile: AvatarProfile) { return this.registry.register(profile); }
  load(identifier: string) { return this.registry.load(identifier); }
  unload(identifier: string) {
    for (const selected of this.selections.values()) if (selected === identifier) throw new Error("AVATAR_IN_USE");
    return this.registry.unload(identifier);
  }
  switchAvatar(sessionId: string, identifier: string) { this.registry.load(identifier); this.selections.set(sessionId, identifier); return this.registry.get(identifier)!; }
  current(sessionId: string) { const identifier = this.selections.get(sessionId); if (!identifier) throw new Error("AVATAR_NOT_SELECTED"); const profile = this.registry.get(identifier); if (!profile || !this.registry.isLoaded(identifier)) throw new Error("AVATAR_NOT_LOADED"); return profile; }
  list() { return this.registry.list(); }
  preview(identifier: string) { return this.registry.preview(identifier); }
  render(sessionId: string, signal: AvatarVisualSignal, elapsedMs = 0) { return this.engine.render(this.current(sessionId), signal, elapsedMs); }
  synchronizeSpeech(phonemes: readonly PhonemeTiming[]) { return this.lipSync.synchronize(phonemes); }
  clearSession(sessionId: string) { this.selections.delete(sessionId); }
}

