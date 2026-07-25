import type { ReactNode } from "react";
import DkPageBackground from "./ui/DkPageBackground";

type DekoKraftPageShellProps = {
  chrome?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export default function DekoKraftPageShell({
  chrome,
  children,
  footer,
  className,
  bodyClassName,
}: DekoKraftPageShellProps) {
  return (
    <div
      className={`publicPageShell dkPublicTheme${className ? ` ${className}` : ""}`}
      data-page-theme="dekokraft-blue"
    >
      <DkPageBackground />
      <div className="publicPageContent">
        {chrome}
        <div className={`publicPageBody${bodyClassName ? ` ${bodyClassName}` : ""}`}>
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}
