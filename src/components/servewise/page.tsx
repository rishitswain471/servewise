import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Loader2,
  Lock,
  MinusCircle,
  Sprout,
  Utensils,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export type MetricItem = {
  label: string;
  value: string;
  caption: string;
  tone?: StatusTone;
};

export type FoundationSection = {
  title: string;
  description: string;
  icon: LucideIcon;
  status: string;
  tone?: StatusTone;
  items: string[];
};

export type DemoTable = {
  caption: string;
  columns: string[];
  rows: string[][];
};

export type FoundationPageConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
  metrics: MetricItem[];
  sections: FoundationSection[];
  table?: DemoTable;
  mode: "dashboard" | "workspace" | "copilot" | "settings";
  futureNote: string;
};

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-border bg-surface-subtle text-muted-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/15 text-warning-foreground",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
};

export function FoundationPage({ config }: { config: FoundationPageConfig }) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader config={config} />
      <JourneyStrip />
      <StateFoundation />
      <MetricsGrid metrics={config.metrics} />
      {config.mode === "copilot" ? <CopilotFoundation /> : null}
      {config.mode === "settings" ? <SettingsFoundation /> : null}
      {config.mode === "workspace" ? <WorkspaceControls /> : null}
      <section
        className="grid min-w-0 gap-4 lg:grid-cols-2"
        aria-label={`${config.title} workspace sections`}
      >
        {config.sections.map((section) => (
          <FeaturePanel key={section.title} section={section} />
        ))}
      </section>
      {config.table ? <DemoDataTable table={config.table} /> : null}
      <FutureBoundary note={config.futureNote} />
    </div>
  );
}

function PageHeader({ config }: { config: FoundationPageConfig }) {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-lg border bg-surface-raised p-5 shadow-card lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="success">{config.eyebrow}</Badge>
          <Badge variant="outline">{config.badge}</Badge>
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {config.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {config.subtitle}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button variant="outline" size="touch" disabled>
          Export unavailable
        </Button>
        <Button variant="subtle" size="touch" disabled>
          Connect kitchen data later
        </Button>
      </div>
    </section>
  );
}

function JourneyStrip() {
  const stages = ["Demand", "Prepare", "Serve", "Rescue", "Verify", "Redistribute", "Measure"];

  return (
    <section
      className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"
      aria-label="ServeWise operational journey"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
          <Utensils className="h-4 w-4" />
        </span>
        Meal flow
      </div>
      <ol className="grid min-w-0 gap-2 sm:grid-cols-7">
        {stages.map((stage, index) => (
          <li
            key={stage}
            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-md bg-surface px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[0.65rem] text-primary-foreground">
              {index + 1}
            </span>
            <span className="truncate">{stage}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StateFoundation() {
  const states = [
    { label: "Loading", icon: Loader2, copy: "Skeletons reserve space while data arrives." },
    { label: "Empty", icon: CircleDashed, copy: "Clear prompts appear before live data exists." },
    { label: "Error", icon: AlertTriangle, copy: "Recoverable panels explain what failed." },
    { label: "Ready", icon: CheckCircle2, copy: "Demo kitchen data shows layout only." },
    { label: "Locked", icon: Lock, copy: "Later-checkpoint controls are visibly unavailable." },
  ];

  return (
    <section
      className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Page state foundations"
    >
      {states.map((state) => {
        const Icon = state.icon;
        return (
          <div
            key={state.label}
            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border bg-card p-3"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{state.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{state.copy}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function MetricsGrid({ metrics }: { metrics: MetricItem[] }) {
  return (
    <section
      className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Kitchen operations metric foundation"
    >
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold">{metric.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator tone={metric.tone ?? "neutral"} label={metric.caption} />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function FeaturePanel({ section }: { section: FoundationSection }) {
  const Icon = section.icon;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{section.title}</span>
            </CardTitle>
            <CardDescription className="mt-2 leading-6">{section.description}</CardDescription>
          </div>
          <StatusIndicator tone={section.tone ?? "neutral"} label={section.status} compact />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2" aria-label={`${section.title} foundations`}>
          {section.items.map((item) => (
            <li
              key={item}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-sm leading-6 text-muted-foreground"
            >
              <MinusCircle className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function WorkspaceControls() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workspace controls</CardTitle>
        <CardDescription>
          Reusable form, tabs, disabled, and loading foundations for later checkpoints.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-4 rounded-lg border bg-surface p-4">
          <div className="grid gap-2">
            <Label htmlFor="service-window">Service window</Label>
            <Select disabled>
              <SelectTrigger id="service-window" aria-label="Service window placeholder">
                <SelectValue placeholder="Lunch service connects later" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lunch">Lunch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assumption">Assumption input</Label>
            <Input
              id="assumption"
              disabled
              placeholder="Attendance, menu, and weather inputs arrive later"
            />
          </div>
        </div>
        <Tabs defaultValue="empty" className="min-w-0 rounded-lg border bg-surface p-4">
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger value="empty">Empty</TabsTrigger>
            <TabsTrigger value="loading">Loading</TabsTrigger>
            <TabsTrigger value="error">Error</TabsTrigger>
          </TabsList>
          <TabsContent value="empty">
            <EmptyState
              title="No live kitchen workspace data"
              description="This panel is ready for kitchen records in later checkpoints."
            />
          </TabsContent>
          <TabsContent value="loading" className="grid gap-2 pt-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </TabsContent>
          <TabsContent value="error">
            <EmptyState
              tone="danger"
              title="Recoverable error state"
              description="Later data calls can render retry actions here without breaking layout."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CopilotFoundation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ServeWise Copilot foundation</CardTitle>
        <CardDescription>
          No AI provider is connected in C1, and no fake food-service explanations are generated.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg border bg-surface p-4">
          <EmptyState
            title="Copilot is not connected yet"
            description="The assistant interface is present, but meal-demand explanations belong to a later checkpoint."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="copilot-message">Message</Label>
          <Textarea
            id="copilot-message"
            disabled
            placeholder="Ask ServeWise Copilot after the AI layer is connected."
          />
          <div className="flex justify-end">
            <Button disabled>Send disabled</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsFoundation() {
  const tabs = ["Profile", "Organization", "Data", "Notifications"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Settings navigation foundation</CardTitle>
        <CardDescription>
          Kitchen, organization, and data setup areas are scaffolded without real authorization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Profile" className="min-w-0">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="grid gap-3 rounded-lg border bg-surface p-4">
                <Label htmlFor={`${tab}-field`}>{tab} placeholder</Label>
                <Input id={`${tab}-field`} disabled placeholder={`${tab} controls connect later`} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DemoDataTable({ table }: { table: DemoTable }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{table.caption}</CardTitle>
        <CardDescription>
          Local food-service demo rows prove spacing, wrapping, and table behavior only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {table.columns.map((column) => (
                <TableHead key={column} className="whitespace-nowrap">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row) => (
              <TableRow key={row.join("-")}>
                {row.map((cell) => (
                  <TableCell key={cell} className="min-w-32">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FutureBoundary({ note }: { note: string }) {
  return (
    <section className="grid gap-3 rounded-lg border bg-surface-raised p-5 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">C1 scope boundary</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Foundation readiness</span>
          <span>70%</span>
        </div>
        <Progress value={70} aria-label="Foundation readiness" />
      </div>
    </section>
  );
}

function EmptyState({
  title,
  description,
  tone = "neutral",
}: {
  title: string;
  description: string;
  tone?: StatusTone;
}) {
  return (
    <div className={cn("rounded-lg border p-4", toneClasses[tone])}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
    </div>
  );
}

export function StatusIndicator({
  label,
  tone = "neutral",
  compact = false,
}: {
  label: string;
  tone?: StatusTone;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border font-medium",
        compact ? "px-2 py-1 text-xs" : "px-2.5 py-1 text-xs",
        toneClasses[tone],
      )}
    >
      <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}
