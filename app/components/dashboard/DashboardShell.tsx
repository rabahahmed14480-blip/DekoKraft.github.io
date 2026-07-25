import type { ReactNode } from "react";
import { classNames } from "../ui/classNames";

type DashboardShellProps = {
  direction: "rtl" | "ltr";
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  logo?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
  identityClassName?: string;
  headingClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  contentClassName?: string;
};

export default function DashboardShell({
  direction,
  title,
  subtitle,
  eyebrow,
  logo,
  children,
  footer,
  className,
  headerClassName,
  identityClassName,
  headingClassName,
  titleClassName,
  subtitleClassName,
  contentClassName,
}: DashboardShellProps) {
  const layoutClass = direction === "rtl" ? "dashboardShellArabic" : "dashboardShellLatin";

  return (
    <div
      className={classNames("dashboardShell", layoutClass, className)}
      dir={direction}
    >
      <header className={classNames("dashboardShellHeader", headerClassName)}>
        <div className={classNames("dashboardShellIdentity", identityClassName)}>
          {logo}
          {(eyebrow || title || subtitle) && (
            <div className={classNames("dashboardShellHeading", headingClassName)}>
              {eyebrow && <span className="dashboardShellEyebrow">{eyebrow}</span>}
              {title && <h2 className={classNames("dashboardShellTitle", titleClassName)}>{title}</h2>}
              {subtitle && <p className={classNames("dashboardShellSubtitle", subtitleClassName)}>{subtitle}</p>}
            </div>
          )}
        </div>
      </header>
      <div className={classNames("dashboardShellContent", contentClassName)}>{children}</div>
      {footer}
    </div>
  );
}
