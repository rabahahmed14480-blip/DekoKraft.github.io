import {
  BarChart3,
  CircleDollarSign,
  Gauge,
  ImageIcon,
  Boxes,
  Landmark,
  Package,
  Settings,
  ShoppingCart,
  UserCheck,
  Users,
  UsersRound,
  WandSparkles,
  ShieldCheck,
  ShieldEllipsis,
  type LucideIcon,
} from "lucide-react";
import { routes } from "./routes";

export type DashboardRole = "admin" | "participant";
export type DashboardPermission = "catalog" | "commerce" | "insights" | "system" | "people";
export type DashboardMenuId =
  | "products"
  | "orders"
  | "customers"
  | "analytics"
  | "media"
  | "inventory"
  | "earnings"
  | "financial"
  | "aiCost"
  | "settings"
  | "studio"
  | "registrations"
  | "participants"
  | "dekoclean"
  | "maintenance";

type DashboardMenuDefinition = {
  id: DashboardMenuId;
  icon: LucideIcon;
  roles: readonly DashboardRole[];
  hrefByRole: Partial<Record<DashboardRole, string>>;
  labelKey: string;
  labelKeyByRole?: Partial<Record<DashboardRole, string>>;
  descriptionKey?: string;
  permission: DashboardPermission;
  orderByRole: Partial<Record<DashboardRole, number>>;
  enabledByRole?: Partial<Record<DashboardRole, boolean>>;
};

export type DashboardMenuItem = {
  id: DashboardMenuId;
  icon: LucideIcon;
  href: string;
  labelKey: string;
  descriptionKey?: string;
  permission: DashboardPermission;
  enabled: boolean;
};

const dashboardMenu: readonly DashboardMenuDefinition[] = [
  { id: "products", icon: Package, roles: ["admin"], hrefByRole: { admin: routes.admin.products }, labelKey: "dashboardCards.products", permission: "catalog", orderByRole: { admin: 1 } },
  { id: "orders", icon: ShoppingCart, roles: ["admin", "participant"], hrefByRole: { admin: routes.admin.orders, participant: routes.participant.orders }, labelKey: "dashboardCards.orders", permission: "commerce", orderByRole: { admin: 2, participant: 2 }, enabledByRole: { participant: false } },
  { id: "customers", icon: Users, roles: ["admin", "participant"], hrefByRole: { admin: routes.admin.customers, participant: routes.participant.customers }, labelKey: "dashboardCards.customers", permission: "commerce", orderByRole: { admin: 3, participant: 4 } },
  { id: "analytics", icon: BarChart3, roles: ["admin", "participant"], hrefByRole: { admin: routes.admin.analytics, participant: routes.participant.analytics }, labelKey: "dashboardCards.analytics", permission: "insights", orderByRole: { admin: 4, participant: 6 }, enabledByRole: { participant: false } },
  { id: "media", icon: ImageIcon, roles: ["admin", "participant"], hrefByRole: { admin: routes.admin.media, participant: routes.smartEdit() }, labelKey: "dashboardCards.media", permission: "catalog", orderByRole: { admin: 5, participant: 3 } },
  { id: "inventory", icon: Boxes, roles: ["admin", "participant"], hrefByRole: { admin: routes.admin.inventory, participant: routes.participant.inventory }, labelKey: "dashboardCards.inventory", labelKeyByRole: { participant: "participantStudio.cardLabels.inventory" }, permission: "catalog", orderByRole: { admin: 6, participant: 5 } },
  { id: "maintenance", icon: ShieldEllipsis, roles: ["participant"], hrefByRole: { participant: routes.participant.maintenance }, labelKey: "participantStudio.cardLabels.maintenance", descriptionKey: "dashboardCardDescriptions.maintenance", permission: "system", orderByRole: { participant: 7 } },
  { id: "earnings", icon: CircleDollarSign, roles: ["admin", "participant"], hrefByRole: { admin: routes.admin.earnings, participant: routes.participant.earnings }, labelKey: "dashboardCards.earnings", labelKeyByRole: { participant: "participantStudio.cardLabels.earnings" }, permission: "commerce", orderByRole: { admin: 7, participant: 8 }, enabledByRole: { participant: false } },
  { id: "financial", icon: Landmark, roles: ["admin"], hrefByRole: { admin: routes.admin.financial }, labelKey: "dashboardCards.financial", permission: "insights", orderByRole: { admin: 8 } },
  { id: "aiCost", icon: Gauge, roles: ["admin"], hrefByRole: { admin: routes.admin.aiCost }, labelKey: "dashboardCards.aiCost", descriptionKey: "dashboardCardDescriptions.aiCost", permission: "insights", orderByRole: { admin: 9 } },
  { id: "settings", icon: Settings, roles: ["admin", "participant"], hrefByRole: { admin: routes.admin.settings, participant: routes.participant.settings }, labelKey: "dashboardCards.settings", labelKeyByRole: { participant: "participantStudio.cardLabels.settings" }, permission: "system", orderByRole: { admin: 10, participant: 10 }, enabledByRole: { participant: false } },
  { id: "studio", icon: WandSparkles, roles: ["admin", "participant"], hrefByRole: { admin: routes.studio, participant: routes.studio }, labelKey: "dashboardCards.studio", permission: "catalog", orderByRole: { admin: 11, participant: 9 } },
  { id: "registrations", icon: UserCheck, roles: ["admin"], hrefByRole: { admin: routes.admin.registrations }, labelKey: "dashboardCards.registrations", permission: "people", orderByRole: { admin: 12 } },
  { id: "participants", icon: UsersRound, roles: ["admin"], hrefByRole: { admin: routes.admin.participants }, labelKey: "dashboardCards.participants", permission: "people", orderByRole: { admin: 13 } },
  { id: "dekoclean", icon: ShieldCheck, roles: ["admin"], hrefByRole: { admin: routes.admin.dekoClean }, labelKey: "dashboardCards.dekoclean", descriptionKey: "dashboardCardDescriptions.dekoclean", permission: "system", orderByRole: { admin: 14 } },
];

export function getDashboardMenu(role: DashboardRole): DashboardMenuItem[] {
  return dashboardMenu
    .filter((item) => item.roles.includes(role) && Boolean(item.hrefByRole[role]))
    .sort((left, right) => (left.orderByRole[role] ?? 999) - (right.orderByRole[role] ?? 999))
    .map((item) => ({
      id: item.id,
      icon: item.icon,
      href: item.hrefByRole[role]!,
      labelKey: item.labelKeyByRole?.[role] ?? item.labelKey,
      descriptionKey: item.descriptionKey,
      permission: item.permission,
      enabled: item.enabledByRole?.[role] ?? true,
    }));
}
