import type { AvatarAnimation, AvatarExpression, AvatarGesture, AvatarPose, AvatarProfile, AvatarRenderFrame, AvatarState, EyeContact, IdleBehavior } from "./types.ts";

export class AvatarRenderer {
  render(input: { profile: AvatarProfile; state: AvatarState; expression: AvatarExpression; gesture: AvatarGesture; eyeContact: EyeContact; pose: AvatarPose; animation: AvatarAnimation; idleBehavior?: IdleBehavior }): AvatarRenderFrame {
    return Object.freeze({ avatarId: input.profile.identifier, state: input.state, expression: Object.freeze({ ...input.expression }), gesture: Object.freeze({ ...input.gesture }), eyeContact: Object.freeze({ ...input.eyeContact }), pose: Object.freeze({ ...input.pose }), animation: Object.freeze({ ...input.animation }), idleBehavior: input.idleBehavior ? Object.freeze({ ...input.idleBehavior }) : undefined, renderQuality: input.profile.renderQuality, renderedAt: new Date().toISOString() });
  }
}

