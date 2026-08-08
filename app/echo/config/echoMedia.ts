import type { EchoMediaConfig } from "../types/echoMedia";

export const ECHO_MEDIA_BREAKPOINT = 768;

export const echoMediaConfig = {
  "page-background": {
    type: "image",
    mobile: "/images/echo/echo-page-background-600.webp",
    desktop: "/images/echo/echo-page-background-1200.webp",
    fallback: "/images/echo/echo-page-background-1200.webp",
    fallbackColor: "#f8efe3",
    position: {
      objectFit: "cover",
      objectPosition: "center top",
      scale: 1,
      top: "0px",
      left: "0px",
    },
  },
  hero: {
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
    },
  },
} satisfies EchoMediaConfig;
