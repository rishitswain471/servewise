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
        d="M5.5 15.75h21c-.75 6.15-4.45 9.25-10.5 9.25S6.25 21.9 5.5 15.75Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.35"
      />
      <path
        d="M8.1 12.3A9.15 9.15 0 0 1 18.5 6.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.35"
      />
      <path
        d="m7.25 8.75.85 3.55 3.45-.85"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M18.2 6.6c2.85-2.3 5.55-2.2 8.1.25-.35 3.4-2.15 5.55-5.4 6.45-2.25-1.7-3.15-3.95-2.7-6.7Z"
        fill="currentColor"
      />
      <path
        d="M20.3 10.8c1.25-1.35 2.7-2.35 4.4-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export const ServeWiseMark = ServeWiseLogo;
export const FallbackRouteIcon = Sprout;
