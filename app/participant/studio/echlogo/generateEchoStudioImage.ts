import { generateEchoSmartEdit } from "../../../../lib/echo/generateEchoSmartEdit";
import type { SmartProductSpecifications } from "../../../../lib/echo/echoProductDNA";
import type { SmartEditOptions } from "../../../../lib/echo/echoGuide";
import type { DecisionResult } from "../../../../lib/decision-engine/types";
import type { EchoGuideRecommendation } from "../../../../lib/echo-guide/types";
import { studioServerFetch } from "../../../studio/lib/studioServerApi";

type GenerateEchoStudioImageInput = {
  participantId: string;
  currentImageId: string;
  prompt: string;
  sourceImage: File;
  productDNA: SmartProductSpecifications;
  options: SmartEditOptions;
};

export async function generateEchoStudioImage({
  participantId,
  currentImageId,
  prompt,
  sourceImage,
  productDNA,
  options,
}: GenerateEchoStudioImageInput) {
  const guideResponse = await studioServerFetch("/api/echo-guide/recommend/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participantId,
      workspace: "image",
      operation: "image-edit",
      userInstruction: prompt,
      currentImageId,
    }),
  });
  const guidePayload = (await guideResponse.json()) as {
    recommendation?: EchoGuideRecommendation;
    message?: string;
  };
  if (!guideResponse.ok || !guidePayload.recommendation) {
    throw new Error(
      guidePayload.message || "تعذر تجهيز توجيه توليد الصورة.",
    );
  }
  const guide = guidePayload.recommendation;

  const decisionResponse = await studioServerFetch("/api/decision-engine/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participantId,
      workspace: "image",
      operation: "image-edit",
      userInstruction: prompt,
      currentImageId,
      echoGuideRecommendationId: guide.id,
      finalPrompt: prompt,
    }),
  });
  const decisionPayload = (await decisionResponse.json()) as {
    decision?: DecisionResult;
    message?: string;
  };
  const decision = decisionPayload.decision;
  if (!decisionResponse.ok || !decision?.canExecute) {
    throw new Error(
      decision?.reasonText ||
        decisionPayload.message ||
        "محرك التوليد غير جاهز لتنفيذ الطلب.",
    );
  }

  const result = await generateEchoSmartEdit({
    sourceImage,
    productDNA,
    options,
    instruction: prompt,
    userInstruction: prompt,
    role: "artisan",
    background: options.background?.mode ?? "original",
    outputFormat: "png",
    preserveProduct: true,
    preserveWick: true,
    sourcePriority: "uploaded-image",
    workspace: "image",
    tool: "smart-edit",
    participantId,
    echoGuideRecommendationId: guide.id,
    model: guide.suggestedModel,
    quality: guide.suggestedQuality,
    size: guide.suggestedSize,
    ratio: guide.suggestedRatio,
    executionId: decision.executionId,
    decisionId: decision.id,
    executionProvider: decision.provider,
    executionPlan: decision.plan,
  });
  if (!result.success || !result.imageBase64) {
    throw new Error(result.message || "لم يُرجع محرك التوليد صورة.");
  }
  return `data:${result.mimeType ?? "image/png"};base64,${result.imageBase64}`;
}
