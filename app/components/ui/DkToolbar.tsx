import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "./classNames";

export type DkToolbarProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "nav";
  dir?: HTMLAttributes<HTMLElement>["dir"];
  "aria-label"?: string;
  "data-dashboard-toolbar"?: string;
};

export default function DkToolbar({ children, className, as = "div", ...props }: DkToolbarProps) {
  const Component = as;
  return <Component className={classNames("dk-toolbar", className)} {...props}>{children}</Component>;
}
