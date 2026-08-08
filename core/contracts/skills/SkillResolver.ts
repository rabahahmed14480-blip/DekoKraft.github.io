import type { ConversationContext } from "../conversation/ConversationContext";
import type { SkillDescriptor } from "./SkillDescriptor";

export interface SkillResolver {
  resolve(intent: string, context: ConversationContext): Promise<SkillDescriptor | undefined>;
}
