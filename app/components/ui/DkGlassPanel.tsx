import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { classNames } from "./classNames";

type PanelElement = "div" | "section" | "article" | "aside" | "nav" | "header" | "footer" | "main";

export type DkGlassPanelProps = {
  children: ReactNode;
  as?: PanelElement;
  strength?: "subtle" | "normal" | "strong";
  className?: string;
  role?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

export default function DkGlassPanel({
  children,
  as = "div",
  strength = "normal",
  className,
  ...props
}: DkGlassPanelProps) {
  const Component = as as ElementType;
  const componentProps: ComponentPropsWithoutRef<"div"> = props;

  return (
    <Component
      className={classNames("dk-glass-panel", `dk-glass-panel--${strength}`, className)}
      {...componentProps}
    >
      {children}
    </Component>
  );
}
