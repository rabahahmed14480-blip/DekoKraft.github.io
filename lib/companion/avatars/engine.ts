import { AvatarExpressionEngine, AvatarPoseEngine, EyeContactEngine, GestureEngine, IdleBehaviorEngine } from "./behaviorEngines.ts";
import { AvatarRenderer } from "./renderer.ts";
import type { AvatarProfile, AvatarState, AvatarVisualSignal } from "./types.ts";

const stateFor = (signal: AvatarVisualSignal): AvatarState => {
  if (signal.interactionType === "listening") return "Listening";
  if (signal.interactionType === "thinking") return "Thinking";
  if (signal.interactionType === "speaking") return "Speaking";
  if (signal.interactionType === "idle") return "Idle";
  const mapping = { happy: "Happy", neutral: "Neutral", confused: "Confused", surprised: "Surprised", warning: "Warning", celebrating: "Celebrating" } as const;
  return mapping[signal.emotion];
};

export class AvatarEngine {
  private expressions = new AvatarExpressionEngine();
  private gestures = new GestureEngine();
  private eyes = new EyeContactEngine();
  private idle = new IdleBehaviorEngine();
  private poses = new AvatarPoseEngine();
  private renderer = new AvatarRenderer();

  render(profile: AvatarProfile, signal: AvatarVisualSignal, elapsedMs = 0) {
    const state = stateFor(signal);
    const animation = profile.animationSet.find(item => item.state === state) ?? profile.animationSet[0];
    return this.renderer.render({
      profile,
      state,
      expression: this.expressions.resolve(profile.supportedExpressions.includes(signal.emotion) ? signal.emotion : "neutral", signal.energy),
      gesture: this.gestures.resolve(signal.emotion, signal.energy, profile.supportedGestures),
      eyeContact: this.eyes.resolve(signal.interactionType, signal.confidence),
      pose: this.poses.resolve(signal.interactionType, signal.energy),
      animation,
      idleBehavior: state === "Idle" ? this.idle.frame(elapsedMs) : undefined,
    });
  }
}

