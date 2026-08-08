import type { AvatarFrame } from "./AvatarFrame";

export interface AvatarRenderer {
  render(avatarId: string, signal: unknown): Promise<AvatarFrame>;
}
