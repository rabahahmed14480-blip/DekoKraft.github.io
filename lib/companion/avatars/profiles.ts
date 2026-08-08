import type { AvatarAnimation, AvatarProfile } from "./types.ts";

const states: AvatarAnimation["state"][] = ["Idle", "Listening", "Thinking", "Speaking", "Happy", "Neutral", "Confused", "Surprised", "Warning", "Celebrating"];
const animations = (prefix: string): AvatarAnimation[] => states.map(state => ({ id: `${prefix}-${state.toLowerCase()}`, state, durationMs: state === "Idle" ? 4_000 : 900, loop: state === "Idle" || state === "Listening" || state === "Speaking", blendMs: 180 }));
const create = (identifier: string, displayName: string, clothing: string): AvatarProfile => ({
  identifier,
  displayName,
  description: `${displayName} visual companion avatar.`,
  kind: "3d",
  gender: "neutral",
  ageStyle: "adult",
  bodyType: "balanced",
  face: "natural",
  hair: "brand-neutral",
  eyes: "expressive",
  clothing,
  voiceProfile: identifier.replace("companion-", "") + "-voice",
  supportedExpressions: ["happy", "neutral", "confused", "surprised", "warning", "celebrating"],
  supportedGestures: ["explain", "welcome", "caution", "celebrate"],
  animationSet: animations(identifier),
  lipSyncModel: "viseme-basic-v1",
  idleAnimation: `${identifier}-idle`,
  renderQuality: "high",
});

export const builtinAvatars: AvatarProfile[] = [
  create("companion-professional", "Professional Avatar", "tailored-neutral"),
  create("companion-friendly", "Friendly Avatar", "casual-warm"),
  create("companion-designer", "Designer Avatar", "creative-modern"),
  create("companion-teacher", "Teacher Avatar", "smart-casual"),
  create("companion-minimal", "Minimal Avatar", "minimal-monochrome"),
  create("companion-sales-expert", "Sales Expert Avatar", "business-modern"),
];

