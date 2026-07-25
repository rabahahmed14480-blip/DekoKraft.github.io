import type { ComponentType, ReactNode } from "react";
import { DkButton, DkGlassPanel } from "../ui";
import { classNames } from "../ui/classNames";

export type DkDashboardGridItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: ComponentType;
  indicators?: ReactNode;
  enabled?: boolean;
};

export default function DkDashboardGrid({
  items,
  className,
  label,
  children,
}: {
  items: DkDashboardGridItem[];
  className?: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <section className={classNames("dk-dashboard-grid", className)} aria-label={label}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <DkGlassPanel as="article" strength="normal" className="dk-dashboard-grid__card" key={item.id}>
            <DkButton href={item.enabled === false ? undefined : item.href} disabled={item.enabled === false} aria-label={item.label} icon={<Icon />} variant="transparent" size="lg">
              {item.description ? (
                <span className="dk-dashboard-grid__content">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                  {item.indicators}
                  {item.enabled === false && <span className="dk-dashboard-grid__badge">قريبًا</span>}
                </span>
              ) : item.label}
            </DkButton>
          </DkGlassPanel>
        );
      })}
      {children}
    </section>
  );
}
