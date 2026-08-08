import type { CSSProperties } from "react";

export type EchoMediaType = "image" | "gif" | "video";

export type EchoMediaSlot = "page-background" | "hero";

export type EchoMediaPosition = {
  objectFit?: CSSProperties["objectFit"];
  objectPosition?: CSSProperties["objectPosition"];
  scale?: number;
  top?: CSSProperties["top"];
  left?: CSSProperties["left"];
  right?: CSSProperties["right"];
};

export type EchoMediaSource = {
  type: EchoMediaType;
  mobile: string;
  desktop: string;
  fallback?: string;
  fallbackColor?: string;
  position?: EchoMediaPosition;
};

export type EchoMediaConfig = Record<EchoMediaSlot, EchoMediaSource>;
