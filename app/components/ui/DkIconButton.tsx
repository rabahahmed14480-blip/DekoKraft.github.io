import type { ReactNode } from "react";
import DkButton, { type DkButtonProps } from "./DkButton";

export type DkIconButtonProps = Omit<DkButtonProps, "children" | "icon" | "iconOnly" | "iconPosition" | "aria-label"> & {
  icon: ReactNode;
  label: string;
  "aria-label"?: string;
};

export default function DkIconButton({
  icon,
  label,
  className,
  "aria-label": ariaLabel,
  title,
  ...props
}: DkIconButtonProps) {
  return (
    <DkButton
      className={`dk-icon-button${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel ?? label}
      icon={icon}
      iconOnly
      {...props}
      title={title ?? label}
    />
  );
}
