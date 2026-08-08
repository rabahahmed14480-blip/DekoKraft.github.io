"use client";

import type { CSSProperties, SyntheticEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ECHO_MEDIA_BREAKPOINT, echoMediaConfig } from "../../config/echoMedia";
import type { EchoMediaSlot, EchoMediaSource } from "../../types/echoMedia";
import "./echo-media-engine.css";

type EchoMediaEngineProps = {
  slot: EchoMediaSlot;
  media?: EchoMediaSource;
  className?: string;
};

type EchoMediaStyle = CSSProperties & {
  "--echo-media-fit": CSSProperties["objectFit"];
  "--echo-media-position": CSSProperties["objectPosition"];
  "--echo-media-scale": number;
  "--echo-media-top": CSSProperties["top"];
  "--echo-media-left": CSSProperties["left"];
  "--echo-media-right": CSSProperties["right"];
  "--echo-media-fallback-color": string;
};

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

function mediaStyle(media: EchoMediaSource): EchoMediaStyle {
  return {
    "--echo-media-fit": media.position?.objectFit ?? "cover",
    "--echo-media-position": media.position?.objectPosition ?? "center center",
    "--echo-media-scale": media.position?.scale ?? 1,
    "--echo-media-top": media.position?.top ?? "0px",
    "--echo-media-left": media.position?.left ?? "0px",
    "--echo-media-right": media.position?.right ?? "auto",
    "--echo-media-fallback-color": media.fallbackColor ?? "#f8efe3",
  };
}

function ResponsivePicture({ media, onError }: { media: EchoMediaSource; onError: () => void }) {
  return (
    <picture className="echoMediaEngine__picture">
      <source media={`(min-width: ${ECHO_MEDIA_BREAKPOINT}px)`} srcSet={media.desktop} />
      {/* Native picture selection is intentional: the URLs stay config-driven and GIFs remain animated. */}
      <img className="echoMediaEngine__asset" src={media.mobile} alt="" onError={onError} />
    </picture>
  );
}

export default function EchoMediaEngine({ slot, media = echoMediaConfig[slot], className }: EchoMediaEngineProps) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMotion = media.type === "gif" || media.type === "video";

  useEffect(() => {
    if (!isMotion || !videoRef.current) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      if (preference.matches) videoRef.current?.pause();
      else void videoRef.current?.play().catch(() => undefined);
    };
    syncPlayback();
    preference.addEventListener("change", syncPlayback);
    return () => preference.removeEventListener("change", syncPlayback);
  }, [isMotion, media]);

  function handleVideoError(event: SyntheticEvent<HTMLVideoElement>) {
    if (event.currentTarget.error) setFailed(true);
  }

  const classes = ["echoMediaEngine", `echoMediaEngine--${slot}`, isMotion && "echoMediaEngine--motion", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={mediaStyle(media)} aria-hidden="true" data-media-type={media.type}>
      {!failed && media.type !== "video" ? <ResponsivePicture media={media} onError={() => setFailed(true)} /> : null}
      {!failed && media.type === "video" ? (
        <video
          ref={videoRef}
          className="echoMediaEngine__asset echoMediaEngine__motionAsset"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={media.fallback}
          onError={handleVideoError}
        >
          <source media={`(min-width: ${ECHO_MEDIA_BREAKPOINT}px)`} src={media.desktop} type="video/mp4" />
          <source src={media.mobile} type="video/mp4" />
        </video>
      ) : null}
      {failed && media.fallback ? (
        // A native fallback must also work for GIF/video and after the primary URL fails.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="echoMediaEngine__asset echoMediaEngine__fallback echoMediaEngine__fallback--visible"
          src={media.fallback}
          alt=""
        />
      ) : null}
      {!failed && isMotion && media.fallback ? (
        <picture className="echoMediaEngine__fallback echoMediaEngine__reducedMotionFallback">
          <source media="(prefers-reduced-motion: reduce)" srcSet={media.fallback} />
          {/* The transparent default prevents downloading the fallback for no-preference users. */}
          <img className="echoMediaEngine__asset" src={TRANSPARENT_PIXEL} alt="" />
        </picture>
      ) : null}
    </div>
  );
}
