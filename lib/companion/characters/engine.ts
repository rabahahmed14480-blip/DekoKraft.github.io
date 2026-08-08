import type { CharacterContext, CharacterProfile, CharacterResponse, SemanticResponse } from "./types.ts";
import { CharacterRenderer } from "./renderer.ts";

const cloneActions = (actions: SemanticResponse["actions"]) => actions.map(action => structuredClone(action));

export class CharacterEngine {
  private renderer: CharacterRenderer;
  constructor(renderer = new CharacterRenderer()) { this.renderer = renderer; }
  transform(semantic: SemanticResponse, profile: CharacterProfile, context: CharacterContext): CharacterResponse {
    if (!semantic.text.trim()) throw new Error("CHARACTER_SEMANTIC_RESPONSE_REQUIRED");
    const rendered = this.renderer.render(semantic, profile, context);
    return Object.freeze({
      characterId: profile.metadata.identifier,
      ...rendered,
      semanticText: semantic.text,
      facts: Object.freeze([...semantic.facts]),
      confidence: semantic.confidence,
      permissions: Object.freeze([...semantic.permissions]),
      actions: Object.freeze(cloneActions(semantic.actions)),
      followUpSuggestions: Object.freeze([...semantic.followUpSuggestions]),
    });
  }
}
