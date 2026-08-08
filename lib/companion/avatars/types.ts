export type AvatarKind = "2d" | "3d" | "metahuman" | "live2d" | "ready-player-me" | "custom" | "brand";
export type AvatarState = "Idle" | "Listening" | "Thinking" | "Speaking" | "Happy" | "Neutral" | "Confused" | "Surprised" | "Warning" | "Celebrating";
export type AvatarEmotion = "happy" | "neutral" | "confused" | "surprised" | "warning" | "celebrating";
export type AvatarInteractionType = "idle" | "listening" | "thinking" | "speaking" | "notification";
export type AvatarRenderQuality = "low" | "balanced" | "high" | "ultra";

export type AvatarExpression = Readonly<{ id: string; eyes: string; brows: string; mouth: string; intensity: number }>;
export type AvatarPose = Readonly<{ id: string; posture: string; head: string; shoulders: string; energy: number }>;
export type AvatarAnimation = Readonly<{ id: string; state: AvatarState; durationMs: number; loop: boolean; blendMs: number }>;
export type AvatarGesture = Readonly<{ id: string; hand: string; intensity: number; durationMs: number }>;
export type EyeContact = Readonly<{ target: "user" | "content" | "ambient"; intensity: number; blinkAllowed: boolean }>;
export type IdleBehavior = Readonly<{ blink: boolean; breathing: number; eyeMovement: number; headMovement: number; naturalMotion: number }>;
export type PhonemeTiming = Readonly<{ phoneme: string; startMs: number; endMs: number }>;
export type MouthCue = Readonly<{ shape: string; startMs: number; endMs: number; intensity: number }>;

export type AvatarProfile = Readonly<{
  identifier: string;
  displayName: string;
  description: string;
  kind: AvatarKind;
  gender: "female" | "male" | "neutral";
  ageStyle: "young" | "adult" | "mature" | "ageless";
  bodyType: string;
  face: string;
  hair: string;
  eyes: string;
  clothing: string;
  voiceProfile: string;
  supportedExpressions: readonly AvatarEmotion[];
  supportedGestures: readonly string[];
  animationSet: readonly AvatarAnimation[];
  lipSyncModel: string;
  idleAnimation: string;
  renderQuality: AvatarRenderQuality;
}>;

export type AvatarVisualSignal = Readonly<{
  emotion: AvatarEmotion;
  energy: number;
  confidence: number;
  interactionType: AvatarInteractionType;
}>;

export type AvatarRenderFrame = Readonly<{
  avatarId: string;
  state: AvatarState;
  expression: AvatarExpression;
  gesture: AvatarGesture;
  eyeContact: EyeContact;
  pose: AvatarPose;
  animation: AvatarAnimation;
  idleBehavior?: IdleBehavior;
  renderQuality: AvatarRenderQuality;
  renderedAt: string;
}>;

export type AvatarPreview = Readonly<{
  identifier: string;
  displayName: string;
  kind: AvatarKind;
  renderQuality: AvatarRenderQuality;
  loaded: boolean;
}>;

