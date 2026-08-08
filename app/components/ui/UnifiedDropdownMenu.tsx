import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "./classNames";

type UnifiedDropdownMenuProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> & {
  as?: "div" | "nav";
  positioning?: "absolute" | "fixed";
  children: ReactNode;
};

export default function UnifiedDropdownMenu({
  as = "div",
  positioning = "absolute",
  className,
  children,
  ...props
}: UnifiedDropdownMenuProps) {
  const unifiedClassName = classNames("unifiedDropdownMenu", className);

  if (as === "nav") {
    return (
      <nav
        className={unifiedClassName}
        data-dropdown-positioning={positioning}
        {...props}
      >
        {children}
      </nav>
    );
  }

  return (
    <div
      className={unifiedClassName}
      data-dropdown-positioning={positioning}
      {...props}
    >
      {children}
    </div>
  );
}
