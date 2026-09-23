import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
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
      { label: "Today’s demand", value: "Not planned", caption: "Kitchen data required", tone: "info" },
      { label: "Preparation", value: "Not recorded", caption: "Lunch service", tone: "neutral" },
      { label: "Service status", value: "Not started", caption: "No service updates", tone: "neutral" },
      { label: "Surplus", value: "No batches", caption: "Rescue queue is clear", tone: "success" },
    ],
    sections: [
      {
        title: "Demand & preparation",
        description: "The next meal plan will appear here when attendance and menu records are available.",
        icon: BarChart3,
        status: "Awaiting data",
        tone: "info",
        items: ["Lunch is the active service window", "Attendance has not been connected", "Preparation quantities have not been recorded"],
      },
      {
        title: "Service status",
        description: "A concise view of preparation, serving, and actual consumption for the active service.",
        icon: Soup,
        status: "Not started",
        items: ["Preparation has no recorded update", "Serving has no recorded update", "Actual consumption is awaiting entry"],
      },
      {
        title: "Surplus rescue",
        description: "Surplus batches requiring verification and recipient coordination will be surfaced here.",
        icon: HeartHandshake,
        status: "Clear",
        tone: "success",
        items: ["No surplus batches are currently listed", "No pickups require coordination"],
      },
      {
        title: "Impact snapshot",
        description: "Verified food, cost, environmental, and community impact will be summarized here.",
        icon: Leaf,
        status: "No records",
        items: ["No rescued-food records for this service", "No impact summary is available"],
      },
    ],
    table: {
      caption: "Recent operational activity",
      description: "Sample entries showing how kitchen updates will be organized.",
      columns: ["Time", "Area", "Update", "Status"],
      rows: [
        ["08:00", "Service Day", "Lunch service opened", "Sample"],
        ["08:15", "Menu", "Lunch menu reviewed", "Sample"],
        ["08:30", "Attendance", "Attendance input requested", "Sample"],
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
        items: ["Attendance", "Menu and portion context", "Calendar and weather context", "Historical consumption"],
      },
      {
        title: "Demand plan",
        description: "Demand and preparation guidance will be presented together for operational review.",
        icon: BarChart3,
        status: "No result",
        items: ["Expected meal demand", "Preparation quantity", "Assumptions and contributing factors"],
      },
    ],
  },
  menu: {
    eyebrow: "Plan",
    title: "Menu & Consumption",
    subtitle: "Organize menus, consumption records, and historical meal patterns.",
    mode: "standard",
    metrics: [
      { label: "Menu records", value: "3 samples", caption: "Lunch and breakfast", tone: "info" },
      { label: "Consumption records", value: "None", caption: "No records connected" },
      { label: "Historical patterns", value: "Unavailable", caption: "Requires consumption history" },
    ],
    sections: [
      {
        title: "Menu records",
        description: "Maintain meal items, serving windows, and portion context.",
        icon: Utensils,
        items: ["Meal item and service window", "Portion and preparation context", "Active menu status"],
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
      description: "Sample menu records for layout preview.",
      columns: ["Menu item", "Service", "Portion", "Record type"],
      rows: [
        ["Rice meal set", "Lunch", "Standard", "Sample"],
        ["Vegetable curry", "Lunch", "Standard", "Sample"],
        ["Breakfast idli", "Breakfast", "Standard", "Sample"],
      ],
    },
  },
  serviceDay: {
    eyebrow: "Operate",
    title: "Service Day",
    subtitle: "Coordinate preparation, serving, actual consumption, and end-of-service review.",
    mode: "service",
    metrics: [
      { label: "Prepared", value: "Not recorded", caption: "Awaiting kitchen entry" },
      { label: "Served", value: "Not recorded", caption: "Awaiting service update" },
      { label: "Actual consumption", value: "Not recorded", caption: "Awaiting service close" },
      { label: "Surplus", value: "Not reviewed", caption: "Review after service", tone: "warning" },
    ],
    sections: [
      {
        title: "Preparation",
        description: "Record what the kitchen prepared for the active meal service.",
        icon: Soup,
        status: "Awaiting entry",
        items: ["Prepared quantity", "Preparation completion", "Kitchen notes"],
      },
      {
        title: "Actual consumption",
        description: "Close the service with served quantities and remaining food.",
        icon: ClipboardCheck,
        status: "Awaiting entry",
        items: ["Served quantity", "Actual consumption", "Remaining quantity and review"],
      },
    ],
  },
  surplus: {
    eyebrow: "Rescue",
    title: "Surplus Rescue",
    subtitle: "Record usable surplus and coordinate the path from verification to pickup.",
    mode: "standard",
    metrics: [
      { label: "Open batches", value: "0", caption: "No batches listed", tone: "success" },
      { label: "Awaiting safety", value: "0", caption: "Verification queue" },
      { label: "Recipient offers", value: "0", caption: "No offers active" },
      { label: "Pickups", value: "0", caption: "No pickups scheduled" },
    ],
    sections: [
      {
        title: "Surplus batches",
        description: "Usable surplus from completed services will appear in this queue.",
        icon: ListChecks,
        status: "Queue clear",
        tone: "success",
        items: ["Meal item and available quantity", "Holding details and handling notes", "Current rescue status"],
      },
      {
        title: "Rescue coordination",
        description: "Coordinate verified batches with recipient availability and pickup windows.",
        icon: HeartHandshake,
        status: "No active pickups",
        items: ["Recipient response", "Pickup window", "Receipt confirmation"],
      },
    ],
  },
  safety: {
    eyebrow: "Rescue",
    title: "Safety Gate",
    subtitle: "Review recorded holding conditions before surplus enters the rescue workflow.",
    mode: "standard",
    metrics: [
      { label: "Awaiting review", value: "0", caption: "Verification queue", tone: "success" },
      { label: "Eligible", value: "0", caption: "No completed checks" },
      { label: "Blocked", value: "0", caption: "No completed checks" },
      { label: "Records", value: "0", caption: "No safety checks" },
    ],
    sections: [
      {
        title: "Verification inputs",
        description: "Review storage time, holding temperature, and handling notes for each batch.",
        icon: Thermometer,
        status: "No batch selected",
        items: ["Recorded storage time", "Recorded holding temperature", "Handling and storage notes"],
      },
      {
        title: "Safety status",
        description: "A completed check will show a clear eligible or blocked outcome with its basis.",
        icon: ShieldCheck,
        status: "Not evaluated",
        items: ["Eligibility outcome", "Threshold used", "Review record"],
      },
    ],
  },
  recipients: {
    eyebrow: "Rescue",
    title: "Recipients",
    subtitle: "Manage recipient organizations, available capacity, and pickup coordination.",
    mode: "standard",
    metrics: [
      { label: "Organizations", value: "3 samples", caption: "Directory preview", tone: "info" },
      { label: "Available today", value: "Unknown", caption: "No availability updates" },
      { label: "Active offers", value: "0", caption: "No offers in progress" },
      { label: "Scheduled pickups", value: "0", caption: "No pickups today" },
    ],
    sections: [
      {
        title: "Recipient directory",
        description: "Recipient profiles bring capacity, pickup windows, and distribution preferences together.",
        icon: UsersRound,
        items: ["Organization and service area", "Capacity and accepted food types", "Contact and pickup preferences"],
      },
      {
        title: "Pickup coordination",
        description: "Track offers, responses, pickup windows, and receipt confirmation.",
        icon: HeartHandshake,
        status: "No active offers",
        items: ["Offer status", "Pickup owner and window", "Handover confirmation"],
      },
    ],
    table: {
      caption: "Recipient organizations",
      description: "Sample organizations for directory layout preview.",
      columns: ["Recipient", "Capacity", "Pickup window", "Record type"],
      rows: [
        ["Community kitchen", "Not set", "Not set", "Sample"],
        ["Shelter partner", "Not set", "Not set", "Sample"],
        ["Student support group", "Not set", "Not set", "Sample"],
      ],
    },
  },
  impact: {
    eyebrow: "Impact",
    title: "Food Rescue Impact",
    subtitle: "Review verified food, financial, environmental, and community outcomes.",
    mode: "standard",
    metrics: [
      { label: "Food rescued", value: "No data", caption: "Awaiting verified records" },
      { label: "Cost avoided", value: "No data", caption: "Awaiting verified records" },
      { label: "Environmental", value: "No data", caption: "Awaiting verified records" },
      { label: "Community reach", value: "No data", caption: "Awaiting verified records" },
    ],
    sections: [
      {
        title: "Impact overview",
        description: "Verified rescue records will roll up into a concise operational summary.",
        icon: Leaf,
        status: "No records",
        items: ["Rescued food", "Avoided food cost", "Environmental estimate", "Meals redistributed"],
      },
      {
        title: "Reporting period",
        description: "Review impact by service day, month, kitchen, or organization.",
        icon: CalendarDays,
        status: "Current month",
        items: ["Period comparison", "Kitchen breakdown", "Recipient distribution summary"],
      },
    ],
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
    subtitle: "Manage kitchen, organization, data, and notification preferences.",
    mode: "settings",
  },
} satisfies Record<string, ProductPageConfig>;