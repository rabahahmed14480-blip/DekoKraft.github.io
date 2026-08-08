import type { ConversationContext } from "../conversation/ConversationContext";
import type { SkillDescriptor } from "./SkillDescriptor";

export interface SkillExecutor {
  execute(skill: SkillDescriptor, input: unknown, context: ConversationContext): Promise<unknown>;
}
