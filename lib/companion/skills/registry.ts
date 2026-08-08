import { SkillLifecycle } from "./lifecycle.ts";
import type { CompanionSkill } from "./types.ts";

export interface ISkillRegistry {
  register(skill: CompanionSkill): CompanionSkill;
  unregister(identifier: string): boolean;
  get(identifier: string): CompanionSkill | undefined;
  list(): CompanionSkill[];
  ready(): CompanionSkill[];
}

const identifierPattern = /^[a-z][a-z0-9.-]{2,79}$/;
const versionPattern = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i;

export class SkillRegistry implements ISkillRegistry {
  readonly lifecycle: SkillLifecycle;
  private skills = new Map<string, CompanionSkill>();
  constructor(lifecycle = new SkillLifecycle()) { this.lifecycle = lifecycle; }

  register(skill: CompanionSkill) {
    const metadata = skill.metadata;
    if (!identifierPattern.test(metadata.identifier)) throw new Error("INVALID_SKILL_IDENTIFIER");
    if (!versionPattern.test(metadata.version)) throw new Error("INVALID_SKILL_VERSION");
    if (!metadata.supportedIntents.length || !metadata.supportedLanguages.length || !Number.isFinite(metadata.priority)) throw new Error("INVALID_SKILL_METADATA");
    if (this.skills.has(metadata.identifier)) throw new Error("SKILL_ALREADY_REGISTERED");
    this.skills.set(metadata.identifier, skill);
    this.lifecycle.set(metadata.identifier, "Registered");
    this.lifecycle.set(metadata.identifier, "Loaded");
    this.lifecycle.set(metadata.identifier, "Ready");
    return skill;
  }

  unregister(identifier: string) {
    const removed = this.skills.delete(identifier);
    if (removed) this.lifecycle.remove(identifier);
    return removed;
  }

  disable(identifier: string) {
    if (!this.skills.has(identifier)) return false;
    this.lifecycle.set(identifier, "Disabled");
    return true;
  }

  enable(identifier: string) {
    if (!this.skills.has(identifier)) return false;
    this.lifecycle.set(identifier, "Ready");
    return true;
  }

  get(identifier: string) { return this.skills.get(identifier); }
  list() { return [...this.skills.values()]; }
  ready() { return this.list().filter(skill => this.lifecycle.get(skill.metadata.identifier) === "Ready"); }
}
