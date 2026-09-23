import {
  BarChart3,
  CalendarDays,
  HeartHandshake,
  Leaf,
  ListChecks,
  ShieldCheck,
  Soup,
  TableProperties,
  Thermometer,
  UsersRound,
  Utensils,
} from "lucide-react";

import type { ProductPageConfig } from "@/components/servewise/page";

export function serveWiseHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — ServeWise` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — ServeWise` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

export const serveWisePages = {
  dashboard: {
    eyebrow: "Today’s Kitchen",
    title: "Kitchen operations at a glance",
    subtitle:
      "Track today’s planning, preparation, service, surplus rescue, and impact from one operational view.",
    mode: "dashboard",
    metrics: [
      {
        label: "Today’s demand",
        value: "Not planned",
        caption: "Kitchen data required",
        tone: "info",
      },
      { label: "Preparation", value: "Not recorded", caption: "Lunch service", tone: "neutral" },
      {
        label: "Service status",
        value: "Not started",
        caption: "No service updates",
        tone: "neutral",
      },
      { label: "Surplus", value: "No batches", caption: "Rescue queue is clear", tone: "success" },
    ],
    sections: [
      {
        title: "Demand & preparation",
        description:
          "The next meal plan will appear here when attendance and menu records are available.",
        icon: BarChart3,
        status: "Awaiting data",
        tone: "info",
        items: [
          "Lunch is the active service window",
          "Attendance has not been connected",
          "Preparation quantities have not been recorded",
        ],
      },
      {
        title: "Service status",
        description:
          "A concise view of preparation, serving, and actual consumption for the active service.",
        icon: Soup,
        status: "Not started",
        items: [
          "Preparation has no recorded update",
          "Serving has no recorded update",
          "Actual consumption is awaiting entry",
        ],
      },
      {
        title: "Surplus rescue",
        description:
          "Surplus batches requiring verification and recipient coordination will be surfaced here.",
        icon: HeartHandshake,
        status: "Clear",
        tone: "success",
        items: ["No surplus batches are currently listed", "No pickups require coordination"],
      },
      {
        title: "Impact snapshot",
        description:
          "Verified food, cost, environmental, and community impact will be summarized here.",
        icon: Leaf,
        status: "No records",
        items: ["No rescued-food records for this service", "No impact summary is available"],
      },
    ],
    table: {
      caption: "Recent operational activity",
      description: "Today’s activity for Demo Kitchen Group.",
      columns: ["Time", "Area", "Update", "Status"],
      rows: [
        ["08:00", "Service Day", "Lunch service opened", "Demo"],
        ["08:15", "Menu", "Lunch menu reviewed", "Demo"],
        ["08:30", "Attendance", "Attendance input requested", "Demo"],
      ],
    },
  },
  demand: {
    eyebrow: "Plan",
    title: "Demand Planning",
    subtitle: "Plan meal demand using attendance, menu, calendar, and historical consumption.",
    mode: "demand",
    sections: [
      {
        title: "Planning context",
        description: "The information used to prepare a meal-service plan.",
        icon: CalendarDays,
        status: "Not connected",
        items: [
          "Attendance",
          "Menu and portion context",
          "Calendar and weather context",
          "Historical consumption",
        ],
      },
      {
        title: "Demand plan",
        description:
          "Demand and preparation guidance will be presented together for operational review.",
        icon: BarChart3,
        status: "No result",
        items: [
          "Expected meal demand",
          "Preparation quantity",
          "Assumptions and contributing factors",
        ],
      },
    ],
  },
  menu: {
    eyebrow: "Plan",
    title: "Menu & Consumption",
    subtitle: "Organize menus, consumption records, and historical meal patterns.",
    mode: "standard",
    metrics: [
      { label: "Menu records", value: "3 demo", caption: "Lunch and breakfast", tone: "info" },
      { label: "Consumption records", value: "None", caption: "No records connected" },
      {
        label: "Historical patterns",
        value: "Unavailable",
        caption: "Requires consumption history",
      },
    ],
    sections: [
      {
        title: "Menu records",
        description: "Maintain meal items, serving windows, and portion context.",
        icon: Utensils,
        items: [
          "Meal item and service window",
          "Portion and preparation context",
          "Active menu status",
        ],
      },
      {
        title: "Historical patterns",
        description: "Compare prepared, served, and remaining quantities over time.",
        icon: TableProperties,
        status: "No history",
        items: ["Consumption by meal service", "Recurring demand patterns", "Menu-level variance"],
      },
    ],
    table: {
      caption: "Menu records",
      description: "Example records for Demo Kitchen Group.",
      columns: ["Menu item", "Service", "Portion", "Record type"],
      rows: [
        ["Rice meal set", "Lunch", "Standard", "Demo"],
        ["Vegetable curry", "Lunch", "Standard", "Demo"],
        ["Breakfast idli", "Breakfast", "Standard", "Demo"],
      ],
    },
  },
  serviceDay: {
    eyebrow: "Operate",
    title: "Service Day",
    subtitle: "Today’s meal service",
    mode: "service",
  },
  surplus: {
    eyebrow: "Rescue",
    title: "Surplus Rescue",
    subtitle: "Record usable surplus and coordinate the path from verification to pickup.",
    mode: "surplus",
  },
  safety: {
    eyebrow: "Rescue",
    title: "Safety Gate",
    subtitle: "Review recorded holding conditions before surplus enters the rescue workflow.",
    mode: "safety",
  },
  recipients: {
    eyebrow: "Rescue",
    title: "Recipients",
    subtitle: "Manage recipient organizations, available capacity, and pickup coordination.",
    mode: "recipients",
  },

  impact: {
    eyebrow: "Impact",
    title: "Food Rescue Impact",
    subtitle: "What this kitchen has achieved, from completed services and confirmed recipient receipts.",
    mode: "impact",
  },
  copilot: {
    eyebrow: "Intelligence",
    title: "ServeWise Copilot",
    subtitle: "Ask questions about verified kitchen results and operational decisions.",
    mode: "copilot",
  },
  settings: {
    eyebrow: "System",
    title: "Settings",
    subtitle: "Manage kitchen, organization, and data preferences.",
    mode: "settings",
  },
} satisfies Record<string, ProductPageConfig>;
