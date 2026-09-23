import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Search,
  Send,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export type ProductSection = {
  title: string;
  description: string;
  icon: LucideIcon;
  status?: string;
  tone?: StatusTone;
  items: string[];
};

export type ProductTable = {
  caption: string;
  description?: string;
  columns: string[];
  rows: string[][];
};

export type ProductPageConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  metrics?: MetricItem[];
  sections?: ProductSection[];
  table?: ProductTable;
  mode: "dashboard" | "demand" | "standard" | "service" | "copilot" | "settings";
};

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-border bg-surface-subtle text-muted-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/15 text-warning-foreground",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
};

export function ProductPage({ config }: { config: ProductPageConfig }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader config={config} />
      {config.metrics?.length ? <MetricsGrid metrics={config.metrics} /> : null}
      {config.mode === "demand" ? <DemandWorkspace /> : null}
      {config.mode === "service" ? <ServiceWorkflow /> : null}
      {config.mode === "copilot" ? <CopilotWorkspace /> : null}
      {config.mode === "settings" ? <SettingsWorkspace /> : null}
      {config.sections?.length ? (
        <section
          className="grid min-w-0 gap-4 lg:grid-cols-2"
          aria-label={`${config.title} overview`}
        >
          {config.sections.map((section) => (
            <ProductPanel key={section.title} section={section} />
          ))}
        </section>
      ) : null}
      {config.table ? <ProductDataTable table={config.table} /> : null}
    </div>
  );
}

function PageHeader({ config }: { config: ProductPageConfig }) {
  return (
    <header className="border-b border-border pb-5">
      <p className="text-xs font-semibold uppercase text-primary">{config.eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
        {config.title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
        {config.subtitle}
      </p>
    </header>
  );
}

function MetricsGrid({ metrics }: { metrics: MetricItem[] }) {
  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
      {metrics.map((metric) => (
        <Card key={metric.label} className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase">{metric.label}</CardDescription>
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

function ProductPanel({ section }: { section: ProductSection }) {
  const Icon = section.icon;
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span>{section.title}</span>
            </CardTitle>
            <CardDescription className="mt-2 leading-6">{section.description}</CardDescription>
          </div>
          {section.status ? (
            <StatusIndicator tone={section.tone ?? "neutral"} label={section.status} compact />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border" aria-label={section.title}>
          {section.items.map((item) => (
            <li key={item} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-sm leading-6 text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DemandWorkspace() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Planning inputs</CardTitle>
        <CardDescription>
          Demand planning becomes available when attendance and kitchen records are connected.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="service-window">Meal service</Label>
            <Select disabled>
              <SelectTrigger id="service-window">
                <SelectValue placeholder="Select a meal service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lunch">Lunch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="attendance">Expected attendance</Label>
            <Input id="attendance" disabled placeholder="Connect attendance data" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="planning-context">Planning context</Label>
            <Input id="planning-context" disabled placeholder="Menu, calendar, and weather" />
          </div>
        </div>
        <EmptyState
          icon={CircleDashed}
          title="No planning result"
          description="Connect kitchen data to create the first demand plan."
        />
      </CardContent>
    </Card>
  );
}

function ServiceWorkflow() {
  const stages = ["Preparation", "Prepared", "Service", "Actuals", "Surplus review"];
  return (
    <section className="border-y border-border py-4" aria-label="Today's service workflow">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Today’s service</h2>
        <Badge variant="outline">Lunch service</Badge>
      </div>
      <ol className="grid gap-2 sm:grid-cols-5">
        {stages.map((stage, index) => (
          <li key={stage} className="flex items-center gap-2 rounded-md bg-surface-subtle px-3 py-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
              {index + 1}
            </span>
            <span className="text-xs font-medium text-foreground">{stage}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CopilotWorkspace() {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-h-64 place-items-center rounded-md border border-dashed bg-surface p-6 text-center">
          <div className="max-w-sm">
            <CircleDashed className="mx-auto h-6 w-6 text-primary" />
            <h2 className="mt-3 text-sm font-semibold text-foreground">No kitchen context available</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Copilot can help explain kitchen results after operational data is available.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-3">
          <div className="grid gap-2">
            <Label htmlFor="copilot-message">Ask about kitchen operations</Label>
            <Textarea id="copilot-message" disabled placeholder="Select a result to discuss" />
          </div>
          <Button disabled className="gap-2">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsWorkspace() {
  const tabs = ["Kitchen", "Organization", "Data", "Notifications"];
  return (
    <Tabs defaultValue="Kitchen" className="min-w-0">
      <TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit sm:grid-cols-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab} value={tab}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">{tab} settings</CardTitle>
              <CardDescription>Configuration for Demo Kitchen Group.</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${tab}-name`}>{tab} name</Label>
                <Input id={`${tab}-name`} disabled placeholder="Demo Kitchen Group" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${tab}-status`}>Status</Label>
                <Input id={`${tab}-status`} disabled placeholder="Not configured" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ProductDataTable({ table }: { table: ProductTable }) {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{table.caption}</CardTitle>
        {table.description ? <CardDescription>{table.description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {table.columns.map((column) => <TableHead key={column}>{column}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row) => (
              <TableRow key={row.join("-")}>
                {row.map((cell) => <TableCell key={cell} className="min-w-32">{cell}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = CircleDashed,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="grid min-h-40 place-items-center rounded-md border border-dashed bg-surface p-5 text-center">
      <div className="max-w-sm">
        <Icon className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="grid gap-3" aria-label="Loading">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-md border p-4", toneClasses.danger)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="text-sm font-medium">Unable to load this section</p>
        <p className="mt-1 text-sm opacity-80">{message}</p>
      </div>
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
  const Icon = tone === "success" ? CheckCircle2 : Clock3;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border font-medium",
        compact ? "px-2 py-1 text-xs" : "px-2.5 py-1 text-xs",
        toneClasses[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}