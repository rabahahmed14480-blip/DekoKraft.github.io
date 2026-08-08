import type { ReactNode } from "react";
import DkIconButton, { type DkIconButtonProps } from "../ui/DkIconButton";

export function HomeToolbarIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="publicHeaderControlIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export default function HomeToolbarIconButton({
  className,
  ...props
}: DkIconButtonProps) {
  return (
    <DkIconButton
      {...props}
      className={`publicHeaderIconButton homeToolbarIconButton${className ? ` ${className}` : ""}`}
      size="md"
      variant="glass"
    />
  );
}
