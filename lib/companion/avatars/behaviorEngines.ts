import type { AvatarEmotion, AvatarExpression, AvatarGesture, AvatarInteractionType, AvatarPose, EyeContact, IdleBehavior, MouthCue, PhonemeTiming } from "./types.ts";

const shapes: Record<string, string> = {
  A: "open-wide", E: "wide", I: "narrow", O: "round", U: "pursed",
  M: "closed", B: "closed", P: "closed", F: "teeth-lip", V: "teeth-lip",
};

export class LipSyncEngine {
  synchronize(phonemes: readonly PhonemeTiming[]): MouthCue[] {
    return phonemes
      .filter(item => item.startMs >= 0 && item.endMs > item.startMs && /^[a-z]+$/i.test(item.phoneme))
      .slice(0, 2_000)
      .map(item => ({ shape: shapes[item.phoneme.toUpperCase()] ?? "neutral", startMs: item.startMs, endMs: item.endMs, intensity: item.phoneme.toUpperCase() === "M" ? .35 : .8 }));
  }
}

export class EyeContactEngine {
  resolve(interactionType: AvatarInteractionType, confidence: number): EyeContact {
    return { target: interactionType === "thinking" ? "content" : interactionType === "idle" ? "ambient" : "user", intensity: Math.max(.25, Math.min(1, confidence)), blinkAllowed: interactionType !== "speaking" };
  }
}

export class IdleBehaviorEngine {
  frame(elapsedMs: number): IdleBehavior {
    const cycle = Math.max(0, elapsedMs) % 6_000;
    return { blink: cycle < 120, breathing: .5 + .5 * Math.sin(cycle / 950), eyeMovement: .25 * Math.sin(cycle / 700), headMovement: .12 * Math.sin(cycle / 1_400), naturalMotion: .35 };
  }
}

export class GestureEngine {
  resolve(emotion: AvatarEmotion, energy: number, supported: readonly string[]): AvatarGesture {
    const preferred = emotion === "celebrating" ? "celebrate" : emotion === "warning" ? "caution" : emotion === "happy" ? "welcome" : "explain";
    const id = supported.includes(preferred) ? preferred : supported[0] ?? "none";
    return { id, hand: id === "none" ? "rest" : "open", intensity: Math.max(0, Math.min(1, energy)), durationMs: 700 };
  }
}

export class AvatarExpressionEngine {
  resolve(emotion: AvatarEmotion, energy: number): AvatarExpression {
    const mouth = emotion === "happy" || emotion === "celebrating" ? "smile" : emotion === "surprised" ? "open" : emotion === "warning" ? "firm" : "neutral";
    const eyes = emotion === "confused" ? "searching" : emotion === "surprised" ? "wide" : "attentive";
    const brows = emotion === "confused" ? "asymmetric" : emotion === "warning" ? "lowered" : "relaxed";
    return { id: emotion, eyes, brows, mouth, intensity: Math.max(.1, Math.min(1, energy)) };
  }
}

export class AvatarPoseEngine {
  resolve(interactionType: AvatarInteractionType, energy: number): AvatarPose {
    return { id: interactionType, posture: interactionType === "listening" ? "lean-forward" : "upright", head: interactionType === "thinking" ? "slight-tilt" : "level", shoulders: "relaxed", energy: Math.max(0, Math.min(1, energy)) };
  }
}

