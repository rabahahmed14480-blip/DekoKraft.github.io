import type { ComponentType, MouseEventHandler, ReactNode } from "react";
import { DkButton, DkGlassPanel, DkResponsiveGrid } from "../ui";
import HomepageSurface from "../home-v2/HomepageSurface";
import { classNames } from "../ui/classNames";

export type DkDashboardGridItem = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  icon: ComponentType;
  indicators?: ReactNode;
  enabled?: boolean;
  active?: boolean;
  status?: "ready" | "needs-activity" | "configured";
  testId?: string;
  debugText?: string;
};

export default function DkDashboardGrid({
  items,
  trailingItems = [],
  className,
  label,
  children,
  cardSurface = "glass",
}: {
  items: DkDashboardGridItem[];
  trailingItems?: DkDashboardGridItem[];
  className?: string;
  label: string;
  children?: ReactNode;
  cardSurface?: "glass" | "homepage";
}) {
  const renderItem = (item: DkDashboardGridItem) => {
    if (item.id === "echlogo-studio") {
      console.log("ECHLOGO GRID RENDER DECISION", {
        id: item.id,
        receivedByGrid: true,
        hidden: false,
        enabled: item.enabled,
        disabled: item.enabled === false,
        href: item.href,
        hasOnClick: typeof item.onClick === "function",
        status: item.status,
        filtered: false,
        willRender: true,
        reason: "trailingItems.map(renderItem) has no visibility filter",
      });
    }
    const Icon = item.icon;
    const content = (
        <DkButton
          href={item.enabled === false ? undefined : item.href}
          onClick={item.enabled === false ? undefined : item.onClick}
          disabled={item.enabled === false}
          active={
            item.active ??
            (item.status === "ready" || item.status === "configured")
          }
          aria-label={item.label}
          icon={<Icon />}
          variant="transparent"
          size="lg"
        >
          {item.description ? (
            <span className="dk-dashboard-grid__content">
              <strong>{item.label}</strong>
              <small>{item.description}</small>
              {item.debugText && <small>{item.debugText}</small>}
              {item.indicators}
              {item.enabled === false && <span className="dk-dashboard-grid__badge">قريبًا</span>}
            </span>
          ) : item.label}
        </DkButton>
    );

    return cardSurface === "homepage" ? (
      <HomepageSurface
        as="article"
        className="dk-dashboard-grid__card"
        interactive={item.enabled !== false}
        data-testid={item.testId}
        key={item.id}
      >
        {content}
      </HomepageSurface>
    ) : (
      <DkGlassPanel
        as="article"
        strength="normal"
        className="dk-dashboard-grid__card"
        data-testid={item.testId}
        key={item.id}
      >
        {content}
      </DkGlassPanel>
    );
  };

  if (cardSurface === "homepage") {
    return (
      <section className={className} aria-label={label}>
        <DkResponsiveGrid desktop={4} tablet={2} mobile={1}>
          {items.map(renderItem)}
          {children}
          {trailingItems.map(renderItem)}
        </DkResponsiveGrid>
      </section>
    );
  }

  return (
    <section className={classNames("dk-dashboard-grid", className)} aria-label={label}>
      {items.map(renderItem)}
      {children}
      {trailingItems.map(renderItem)}
    </section>
  );
}
