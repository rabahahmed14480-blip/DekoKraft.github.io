import type { ElementType, ReactNode } from "react";

type HomepageSurfaceProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  interactive?: boolean;
  "data-testid"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export default function HomepageSurface({
  children,
  as: Component = "div",
  className,
  interactive = false,
  ...props
}: HomepageSurfaceProps) {
  return (
    <Component
      className={[
        "homepage-surface",
        interactive && "homepage-surface--interactive",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
