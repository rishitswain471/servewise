import type { ComponentType, SVGProps } from "react";
import {
  Bot,
  CalendarClock,
  ClipboardCheck,
  Gauge,
  HeartHandshake,
  Leaf,
  Settings,
  ShieldCheck,
  Soup,
  Sprout,
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

export type ServeWiseNavGroup =
  "Today" | "Plan" | "Operate" | "Rescue" | "Impact" | "Intelligence" | "System";

export type ServeWiseNavItem = {
  title: string;
  href: ServeWiseRoute;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
  group: ServeWiseNavGroup;
};

export const serveWiseNavItems: ServeWiseNavItem[] = [
  {
    title: "Today’s Kitchen",
    href: "/dashboard",
    icon: CalendarClock,
    description: "Daily meal operations command center",
    group: "Today",
  },
  {
    title: "Demand Planning",
    href: "/demand",
    icon: Gauge,
    description: "Attendance and preparation planning",
    group: "Plan",
  },
  {
    title: "Menu & Consumption",
    href: "/menu",
    icon: Utensils,
    description: "Menu patterns and consumption records",
    group: "Plan",
  },
  {
    title: "Service Day",
    href: "/service-day",
    icon: Soup,
    description: "Preparation, serving, and actuals",
    group: "Operate",
  },
  {
    title: "Surplus Rescue",
    href: "/surplus",
    icon: HeartHandshake,
    description: "Usable surplus workflow",
    group: "Rescue",
  },
  {
    title: "Safety Gate",
    href: "/safety",
    icon: ShieldCheck,
    description: "Storage time and temperature checks",
    group: "Rescue",
  },
  {
    title: "Recipients",
    href: "/recipients",
    icon: UsersRound,
    description: "Recipient availability and pickup fit",
    group: "Rescue",
  },
  {
    title: "Impact",
    href: "/impact",
    icon: Leaf,
    description: "Food rescue and sustainability reporting",
    group: "Impact",
  },
  {
    title: "ServeWise Copilot",
    href: "/copilot",
    icon: Bot,
    description: "Operational result explanations",
    group: "Intelligence",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Kitchen, data, and team setup",
    group: "System",
  },
];

const groupOrder: ServeWiseNavGroup[] = [
  "Today",
  "Plan",
  "Operate",
  "Rescue",
  "Impact",
  "Intelligence",
  "System",
];

export const groupedServeWiseNavItems = groupOrder.reduce(
  (groups, group) => ({
    ...groups,
    [group]: serveWiseNavItems.filter((item) => item.group === group),
  }),
  {} as Record<ServeWiseNavGroup, ServeWiseNavItem[]>,
);

export function getRouteLabel(pathname: string) {
  if (pathname === "/") return "Today’s Kitchen";
  return serveWiseNavItems.find((item) => item.href === pathname)?.title ?? "Not found";
}

export function getRouteJourney(pathname: string) {
  if (pathname === "/") return "Today";
  return serveWiseNavItems.find((item) => item.href === pathname)?.group ?? "Workspace";
}

export function ServeWiseLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="ServeWise" {...props}>
      <path
        d="M6.75 17.3c.95 4.25 4.75 7.45 9.3 7.45 3.1 0 5.86-1.48 7.6-3.78"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.35"
      />
      <path
        d="M25.3 14.62c-.82-4.18-4.52-7.37-8.98-7.37-3.05 0-5.76 1.5-7.43 3.78"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.35"
      />
      <path
        d="M9.35 10.8 8.7 6.55l4.04 1.46"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.1"
      />
      <path
        d="m22.86 21.2.55 4.25-3.98-1.56"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.1"
      />
      <path
        d="M10.25 16.15c1.35-2.15 3.16-3.23 5.42-3.23 2.44 0 4.47 1.24 6.08 3.72-1.47 1.78-3.45 2.67-5.93 2.67-2.28 0-4.14-1.05-5.57-3.16Z"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M15.95 11.75c2.2-1.1 4.08-.92 5.65.53-.08 2.12-1.12 3.6-3.1 4.43-1.87-1.02-2.72-2.68-2.55-4.96Z"
        fill="currentColor"
      />
      <path
        d="M11.2 17.2h10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export const ServeWiseMark = ServeWiseLogo;
export const FallbackRouteIcon = Sprout;
