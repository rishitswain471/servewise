import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardCheck,
  Database,
  HeartHandshake,
  Leaf,
  ListChecks,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Soup,
  TableProperties,
  Thermometer,
  UsersRound,
  Utensils,
} from "lucide-react";

import type { FoundationPageConfig } from "@/components/servewise/page";

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

export const foundationPages = {
  dashboard: {
    eyebrow: "Today’s Kitchen",
    title: "Today’s Kitchen command center",
    subtitle:
      "A stable command-center shell for meal demand, kitchen preparation, service status, surplus rescue, safety, redistribution, and impact. Values shown here are local demo UI data only.",
    badge: "C1 foundation",
    mode: "dashboard",
    futureNote:
      "Real operational data, forecasts, and impact calculations are intentionally deferred to later checkpoints.",
    metrics: [
      { label: "Today’s Demand", value: "Ready", caption: "Forecast module pending", tone: "info" },
      { label: "Preparation", value: "Demo", caption: "No prep records yet", tone: "neutral" },
      { label: "Surplus Rescue", value: "0 live", caption: "Workflow scaffolded", tone: "success" },
      { label: "Safety", value: "Manual", caption: "Logic arrives later", tone: "warning" },
    ],
    sections: [
      {
        title: "Meal service overview",
        description:
          "Page structure for kitchen leaders to scan meal demand, preparation, service risks, and surplus movement.",
        icon: BarChart3,
        status: "Layout ready",
        tone: "success",
        items: ["Responsive KPI grid", "Activity section foundation", "Clear demo-data labeling"],
      },
      {
        title: "Service floor activity",
        description:
          "Future event stream area for meal service updates, surplus changes, and recipient pickup decisions.",
        icon: ListChecks,
        status: "Demo only",
        items: ["Empty state support", "Error and loading slots", "No backend events represented"],
      },
    ],
    table: {
      caption: "Operational section map",
      columns: ["Meal-flow area", "C1 status", "Later checkpoint"],
      rows: [
        ["Demand planning", "Workspace routed", "Forecast engine"],
        ["Surplus rescue", "Batch UI foundation", "Safety and matching logic"],
        ["Impact reporting", "Dashboard shell", "Deterministic calculations"],
      ],
    },
  },
  demand: {
    eyebrow: "Demand Lab",
    title: "Demand planning workspace foundation",
    subtitle:
      "A focused planning workspace for future attendance, calendar, weather, menu, and historical meal-consumption inputs without implementing forecasting logic in C1.",
    badge: "No demand engine yet",
    mode: "workspace",
    futureNote:
      "Demand calculations and preparation recommendations are deliberately not implemented in this checkpoint.",
    metrics: [
      {
        label: "Input controls",
        value: "Ready",
        caption: "Disabled until logic exists",
        tone: "info",
      },
      { label: "Forecast result", value: "Empty", caption: "No fake forecast", tone: "neutral" },
      { label: "Explanation panel", value: "Shell", caption: "AI layer deferred", tone: "warning" },
      {
        label: "Scenario changes",
        value: "Future",
        caption: "Simulation arrives later",
        tone: "neutral",
      },
    ],
    sections: [
      {
        title: "Planning inputs area",
        description:
          "Prepared for attendance, menu, calendar, weather, and service-window assumptions in later checkpoints.",
        icon: SlidersHorizontal,
        status: "Disabled",
        tone: "warning",
        items: [
          "Form labels and disabled states",
          "Touch-friendly control sizing",
          "No live calculations",
        ],
      },
      {
        title: "Forecast results",
        description:
          "Space for deterministic demand and preparation outputs once the engine exists.",
        icon: BarChart3,
        status: "Placeholder",
        items: ["Result-card foundation", "Explanation area foundation", "No invented meal counts"],
      },
    ],
  },
  menu: {
    eyebrow: "Menu & Consumption",
    title: "Menu and consumption records foundation",
    subtitle:
      "A clean kitchen-records foundation for menus, portions, prepared quantities, and historical consumption without adding storage or imported records yet.",
    badge: "Local demo rows",
    mode: "workspace",
    futureNote:
      "Historical consumption tracking and database-backed menu records belong to later checkpoints.",
    metrics: [
      { label: "Meal records", value: "Table", caption: "Structure only", tone: "info" },
      { label: "Consumption", value: "Empty", caption: "No saved data", tone: "neutral" },
      { label: "Pattern view", value: "Slot", caption: "Charts connect later", tone: "warning" },
      { label: "Imports", value: "Disabled", caption: "No persistence", tone: "neutral" },
    ],
    sections: [
      {
        title: "Consumption patterns",
        description:
          "Prepared for future comparison of planned meals, prepared trays, served portions, and remaining quantities.",
        icon: TableProperties,
        status: "Ready",
        tone: "success",
        items: ["Responsive table shell", "Empty state ready", "Chart placeholder area"],
      },
      {
        title: "Meal context",
        description:
          "Foundation for dish-level setup, service windows, portion sizes, and item-level trends.",
        icon: Utensils,
        status: "Scaffolded",
        items: ["Menu list layout", "Form component reuse", "No stored menu data"],
      },
    ],
    table: {
      caption: "Menu table foundation",
      columns: ["Menu item", "Service", "State"],
      rows: [
        ["Rice meal set", "Lunch", "Demo row"],
        ["Vegetable curry", "Lunch", "Demo row"],
        ["Breakfast idli", "Morning", "Demo row"],
      ],
    },
  },
  serviceDay: {
    eyebrow: "Service Day",
    title: "Preparation and service-day workflow",
    subtitle:
      "A service-day workspace that separates meal preparation, live serving, actual consumption entry, and surplus review without implementing persistence.",
    badge: "Workflow shell",
    mode: "workspace",
    futureNote:
      "Prepared quantities, actual consumption, and surplus detection logic are deferred beyond C1.",
    metrics: [
      { label: "Prepared", value: "Slot", caption: "Input later", tone: "info" },
      { label: "Served", value: "Slot", caption: "Workflow later", tone: "neutral" },
      { label: "Actuals", value: "Slot", caption: "No backend", tone: "warning" },
      { label: "Review", value: "Ready", caption: "Layout only", tone: "success" },
    ],
    sections: [
      {
        title: "Preparation checkpoint",
        description: "A future place to compare recommended and actually prepared quantities.",
        icon: Soup,
        status: "Placeholder",
        items: ["Prepared-section hierarchy", "Disabled action states", "No recommendation engine"],
      },
      {
        title: "Actual consumption",
        description:
          "A foundation for service-day actuals and review without pretending records exist.",
        icon: ClipboardCheck,
        status: "Not connected",
        tone: "warning",
        items: ["Actuals area", "Review state", "Error and empty-state coverage"],
      },
    ],
  },
  surplus: {
    eyebrow: "Surplus Rescue",
    title: "Surplus rescue workspace",
    subtitle:
      "A future-ready queue for recording usable surplus, filtering rescue status, and coordinating pickup work without safety or matching logic yet.",
    badge: "No live batches",
    mode: "workspace",
    futureNote:
      "Surplus detection, offers, accept/decline, and pickup tracking are not implemented in C1.",
    metrics: [
      { label: "Live surplus", value: "0", caption: "No backend source", tone: "neutral" },
      { label: "Batch form", value: "Ready", caption: "Disabled", tone: "info" },
      { label: "Pickup status", value: "Future", caption: "Workflow later", tone: "warning" },
      { label: "Recipient offers", value: "Future", caption: "Matching later", tone: "neutral" },
    ],
    sections: [
      {
        title: "Surplus capture",
        description:
          "Space for meal item, quantity, storage time, holding temperature, and handling notes in later checkpoints.",
        icon: Database,
        status: "Form shell",
        items: ["Filter/status bar foundation", "Batch list empty state", "No surplus detection"],
      },
      {
        title: "Redistribution workflow",
        description:
          "Foundation for recipient offers and pickup tracking after safety eligibility exists.",
        icon: HeartHandshake,
        status: "Pending logic",
        tone: "warning",
        items: ["Offer section placeholder", "Pickup timeline area", "No recipient matching"],
      },
    ],
  },
  safety: {
    eyebrow: "Safety Gate",
    title: "Safety gate workspace",
    subtitle:
      "A visual foundation for future food holding-time and temperature checks. C1 does not make eligibility decisions.",
    badge: "Logic deferred",
    mode: "workspace",
    futureNote:
      "Deterministic food-safety eligibility rules and configurable thresholds will be added later; this page does not evaluate food safety.",
    metrics: [
      { label: "Eligibility", value: "Not run", caption: "No safety logic", tone: "warning" },
      { label: "Temperature", value: "Field", caption: "Disabled", tone: "neutral" },
      { label: "Storage time", value: "Field", caption: "Disabled", tone: "neutral" },
      { label: "Audit trail", value: "Future", caption: "No records", tone: "info" },
    ],
    sections: [
      {
        title: "Verification inputs",
        description: "Prepared for recorded storage time, holding temperature, and handling notes.",
        icon: Thermometer,
        status: "Disabled",
        tone: "warning",
        items: ["Labeled fields", "Safety status area", "No legal or universal threshold claims"],
      },
      {
        title: "Eligibility result",
        description: "Future deterministic output area for Eligible or Blocked states.",
        icon: ShieldCheck,
        status: "Not calculated",
        tone: "warning",
        items: [
          "Eligible/blocked visual slots",
          "Audit-friendly messaging",
          "No automated decision yet",
        ],
      },
    ],
  },
  recipients: {
    eyebrow: "Recipients",
    title: "Recipient network foundation",
    subtitle:
      "A recipient network foundation for availability, capacity, pickup windows, and distribution preferences without live matching.",
    badge: "Matching deferred",
    mode: "workspace",
    futureNote:
      "Recipient profiles, availability, ranking, and accept/decline tracking are planned for later checkpoints.",
    metrics: [
      { label: "Recipients", value: "List", caption: "Demo rows only", tone: "info" },
      { label: "Availability", value: "Future", caption: "No live status", tone: "neutral" },
      { label: "Matching", value: "Off", caption: "No algorithm", tone: "warning" },
      { label: "Pickup", value: "Future", caption: "Workflow shell", tone: "neutral" },
    ],
    sections: [
      {
        title: "Recipient directory",
        description:
          "Foundation for recipient profiles, capacity, address, and contact preferences.",
        icon: UsersRound,
        status: "Scaffolded",
        tone: "success",
        items: ["Responsive list area", "Empty state", "No saved profiles"],
      },
      {
        title: "Matching queue",
        description:
          "Prepared for future deterministic matching once safety and surplus batches exist.",
        icon: HeartHandshake,
        status: "No matching",
        tone: "warning",
        items: ["Status foundation", "Offer action placeholders", "No fake matches"],
      },
    ],
    table: {
      caption: "Recipient table foundation",
      columns: ["Recipient", "Capacity", "State"],
      rows: [
        ["Community kitchen", "Demo capacity", "Not live"],
        ["Shelter partner", "Demo capacity", "Not live"],
        ["Student volunteer group", "Demo capacity", "Not live"],
      ],
    },
  },
  impact: {
    eyebrow: "Impact",
    title: "Food rescue impact foundation",
    subtitle:
      "A reporting foundation for later deterministic food rescue, cost, carbon, and community impact calculations, with no fabricated savings or environmental claims.",
    badge: "Calculations pending",
    mode: "dashboard",
    futureNote:
      "Impact estimates will be deterministic and explainable later; C1 only provides the visual foundation.",
    metrics: [
      { label: "Food rescued", value: "Future", caption: "No calculation", tone: "warning" },
      { label: "Cost avoided", value: "Future", caption: "No calculation", tone: "warning" },
      { label: "Carbon estimate", value: "Future", caption: "No calculation", tone: "warning" },
      { label: "Meals served", value: "Future", caption: "No calculation", tone: "warning" },
    ],
    sections: [
      {
        title: "Rescue impact",
        description:
          "Foundation for rescued-food and operating-cost summaries once verified quantities exist.",
        icon: Leaf,
        status: "Placeholder",
        items: ["Metric grouping", "Trend area", "No impact figures invented"],
      },
      {
        title: "Reporting readiness",
        description:
          "Space for period filters, exports, and stakeholder summaries after real data exists.",
        icon: CalendarDays,
        status: "Disabled",
        tone: "warning",
        items: ["Filter foundation", "Export disabled state", "Report shell"],
      },
    ],
  },
  copilot: {
    eyebrow: "ServeWise Copilot",
    title: "Food-service explanation assistant foundation",
    subtitle:
      "A chat workspace shell for later food-service explanation features. C1 does not call Gemini, Copilot, or any AI provider.",
    badge: "No AI connected",
    mode: "copilot",
    futureNote:
      "AI will only explain verified application results in a later checkpoint and will not become the source of truth.",
    metrics: [
      { label: "Provider", value: "None", caption: "No Gemini calls", tone: "warning" },
      { label: "Responses", value: "Disabled", caption: "No fake chat", tone: "neutral" },
      { label: "Context", value: "Future", caption: "Verified results later", tone: "info" },
      { label: "Auditability", value: "Planned", caption: "Explanations later", tone: "success" },
    ],
    sections: [
      {
        title: "Kitchen question composer",
        description: "Accessible chat input foundation for later natural-language explanations.",
        icon: Bot,
        status: "Disabled",
        tone: "warning",
        items: ["Textarea and send state", "No AI request", "No fake answer"],
      },
      {
        title: "Verified result context",
        description:
          "Future area for deterministic calculation outputs that the assistant may explain.",
        icon: AlertTriangle,
        status: "Future",
        items: ["Context panel shell", "Traceability placeholder", "No calculation source"],
      },
    ],
  },
  settings: {
    eyebrow: "Settings",
    title: "Kitchen organization setup foundation",
    subtitle:
      "A settings shell for kitchen profile, organization context, data, and notification areas without authentication or authorization implementation.",
    badge: "No auth yet",
    mode: "settings",
    futureNote:
      "Authentication, roles, organization access, and database-backed settings are not part of C1.",
    metrics: [
      { label: "Profile", value: "Shell", caption: "No account data", tone: "info" },
      { label: "Organization", value: "Shell", caption: "Local context", tone: "neutral" },
      { label: "Data", value: "Future", caption: "No database", tone: "warning" },
      { label: "Permissions", value: "Future", caption: "No auth", tone: "warning" },
    ],
    sections: [
      {
        title: "Kitchen context",
        description:
          "Foundation for kitchen group identity, service windows, and workspace settings.",
        icon: Settings,
        status: "Scaffolded",
        tone: "success",
        items: ["Settings tabs", "Disabled fields", "No authorization claims"],
      },
      {
        title: "Data readiness",
        description: "Prepared for later import, retention, and configuration controls.",
        icon: Database,
        status: "Future",
        items: ["Data section placeholder", "Error state support", "No persistence"],
      },
    ],
  },
} satisfies Record<string, FoundationPageConfig>;
