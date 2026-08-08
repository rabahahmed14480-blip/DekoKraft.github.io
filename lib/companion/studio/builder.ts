import { randomUUID } from "node:crypto";
import type { CompanionPackage, CompanionTemplateType, MarketplaceMetadata } from "./types.ts";
import { AssistantWizard, AvatarWizard } from "./wizards.ts";

export class CompanionBuilder {
  readonly assistant = new AssistantWizard();
  readonly avatar = new AvatarWizard();

  build(metadata: MarketplaceMetadata, templateType: CompanionTemplateType = "general"): CompanionPackage {
    const assistant = this.assistant.build();
    const avatar = this.avatar.build();
    const timestamp = new Date().toISOString();
    return Object.freeze({
      schemaVersion: 1,
      packageId: randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
      templateType,
      brain: assistant.brain,
      skills: assistant.skills,
      character: assistant.character,
      avatar: avatar.avatar,
      voice: avatar.voice,
      permissions: assistant.permissions,
      configuration: assistant.configuration,
      expressions: avatar.expressions,
      animationPresets: avatar.animationPresets,
      visualIdentity: avatar.visualIdentity,
      metadata: Object.freeze({ ...metadata, tags: Object.freeze([...metadata.tags]) }),
    });
  }
}

