import type { EchoMediaSource } from "../types/echoMedia";

export const welcomeMediaConfig = {
  type: "image",
  mobile: "/images/echo/echo-hero-desktop-600.webp",
  desktop: "/images/echo/echo-hero-desktop-1200.webp",
  fallback: "/images/echo/echo-hero-desktop-1200.webp",
  fallbackColor: "#f8efe3",
  position: {
    objectFit: "cover",
    objectPosition: "center center",
    scale: 1,
    top: "0px",
    left: "0px",
    right: "auto",
  },
} satisfies EchoMediaSource;
