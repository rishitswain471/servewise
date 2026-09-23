import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  ClipboardCheck,
  Gauge,
  HeartHandshake,
  LayoutDashboard,
  Leaf,
  Settings,
  ShieldCheck,
  Sparkles,
  Utensils,
  UsersRound,
} from "lucide-react";

export type ServeWiseRoute =
  | "/dashboard"
  | "/demand"
  | "/menu"
  | "/service-day"
  | "/surplus"
  | "/safety"
  | "/recipients"
  | "/impact"
  | "/copilot"
  | "/settings";

export type ServeWiseNavItem = {
  title: string;
  href: ServeWiseRoute;
  icon: LucideIcon;
  description: string;
  group: "Operations" | "Rescue workflow" | "System";
};

export const serveWiseNavItems: ServeWiseNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Daily operating overview",
    group: "Operations",
  },
  {
    title: "Demand Lab",
    href: "/demand",
    icon: Gauge,
    description: "Forecast workspace foundation",
    group: "Operations",
  },
  {
    title: "Menu / Consumption",
    href: "/menu",
    icon: Utensils,
    description: "Menu and consumption analysis",
    group: "Operations",
  },
  {
    title: "Service Day",
    href: "/service-day",
    icon: ClipboardCheck,
    description: "Prepared, served, and actuals workflow",
    group: "Operations",
  },
  {
    title: "Surplus Rescue",
    href: "/surplus",
    icon: HeartHandshake,
    description: "Surplus batch workspace",
    group: "Rescue workflow",
  },
  {
    title: "Safety Gate",
    href: "/safety",
    icon: ShieldCheck,
    description: "Safety verification foundation",
    group: "Rescue workflow",
  },
  {
    title: "Recipients",
    href: "/recipients",
    icon: UsersRound,
    description: "Recipient list and matching foundation",
    group: "Rescue workflow",
  },
  {
    title: "Impact",
    href: "/impact",
    icon: Leaf,
    description: "Food, cost, and carbon view",
    group: "Rescue workflow",
  },
  {
    title: "ServeWise Copilot",
    href: "/copilot",
    icon: Bot,
    description: "Assistant interface foundation",
    group: "System",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Organization and data setup",
    group: "System",
  },
];

export const groupedServeWiseNavItems = serveWiseNavItems.reduce(
  (groups, item) => {
    groups[item.group].push(item);
    return groups;
  },
  {
    Operations: [] as ServeWiseNavItem[],
    "Rescue workflow": [] as ServeWiseNavItem[],
    System: [] as ServeWiseNavItem[],
  },
);

export function getRouteLabel(pathname: string) {
  if (pathname === "/") return "Dashboard";
  return serveWiseNavItems.find((item) => item.href === pathname)?.title ?? "Not found";
}

export const ServeWiseMark = Sparkles;
export const FallbackRouteIcon = BarChart3;
