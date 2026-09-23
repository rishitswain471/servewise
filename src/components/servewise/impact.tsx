import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { BarChart3, Calculator, HeartHandshake, Leaf, UsersRound } from "lucide-react";

import { EmptyState, ErrorState, LoadingState, MetricsGrid } from "@/components/servewise/page";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeImpact, type Period } from "@/lib/impact-engine";
import { getImpactData } from "@/lib/impact.functions";

const periods: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "all", label: "All time" },
];
const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 1000) / 10}%`);
const signed = (v: number) => (v > 0 ? `+${v}` : String(v));

export function ImpactWorkspace() {
  const fn = useServerFn(getImpactData);
  const q = useQuery({ queryKey: ["impact-data"], queryFn: () => fn() });
  const [period, setPeriod] = useState<Period>("all");
  const r = useMemo(() => (q.data ? computeImpact(q.data, period) : null), [q.data, period]);

  if (q.isLoading) return <LoadingState />;
  if (q.isError || !r) return <ErrorState message="Unable to load impact data. Please try again." />;
  const hasReceipt = r.completedReceipts > 0;
  const noRedistribution = "No completed redistribution yet";

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Reporting period">
        {periods.map((p) => (
          <Button key={p.id} size="sm" variant={period === p.id ? "default" : "outline"} onClick={() => setPeriod(p.id)} aria-pressed={period === p.id}>
            {p.label}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground">Filtered by service date.</span>
      </div>

      <MetricsGrid metrics={[
        { label: "Food redistributed", value: hasReceipt ? `${r.received} meals` : "None yet", caption: hasReceipt ? `${r.completedReceipts} confirmed receipt${r.completedReceipts === 1 ? "" : "s"}` : noRedistribution, tone: hasReceipt ? "success" : "neutral" },
        { label: "Services completed", value: String(r.servicesCompleted), caption: "From Service Day", tone: r.servicesCompleted ? "info" : "neutral" },
        { label: "Surplus identified", value: `${r.potential} meals`, caption: "Prepared − consumed", tone: r.potential ? "warning" : "neutral" },
        { label: "Redistribution rate", value: hasReceipt ? pct(r.rate) : "—", caption: hasReceipt ? `${r.received} received ÷ ${r.potential} identified` : noRedistribution, tone: hasReceipt ? "success" : "neutral" },
      ]} />

      {r.servicesCompleted === 0 ? (
        <EmptyState icon={Leaf} title="No completed services in this period" description="Impact metrics will appear after services are completed in Service Day and surplus is successfully received by a recipient organization." />
      ) : (
        <>
          {!hasReceipt ? (
            <EmptyState icon={HeartHandshake} title={noRedistribution} description="Impact metrics will appear after a surplus is successfully received by a recipient organization." />
          ) : null}
          <section className="grid min-w-0 gap-4 lg:grid-cols-2">
            <OperationalView r={r} />
            <Funnel r={r} />
          </section>
          <section className="grid min-w-0 gap-4 lg:grid-cols-2">
            <MealBreakdown r={r} />
            <Recipients r={r} />
          </section>
          <ForecastVsActual r={r} />
        </>
      )}
      <Estimates received={r.received} hasReceipt={hasReceipt} />
    </div>
  );
}

type R = ReturnType<typeof computeImpact>;

function Bar({ label, value, max, strong }: { label: string; value: number; max: number; strong?: boolean }) {
  const w = max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-sm">
      <span className="truncate text-muted-foreground">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={strong ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-primary/50"} style={{ width: `${w}%` }} />
      </div>
      <span className="text-right font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function OperationalView({ r }: { r: R }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" />Operational view</CardTitle>
        <CardDescription>Meals across completed services in this period.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Bar label="Prepared" value={r.prepared} max={r.prepared} />
        <Bar label="Consumed" value={r.consumed} max={r.prepared} />
        <Bar label="Potential surplus" value={r.potential} max={r.prepared} />
        <Bar label="Redistributed" value={r.received} max={r.prepared} strong />
        <p className="pt-1 text-xs leading-5 text-muted-foreground">
          {r.potential - r.received} of {r.potential} surplus meals were not confirmed as received.
        </p>
      </CardContent>
    </Card>
  );
}

function Funnel({ r }: { r: R }) {
  const steps = [
    ["Potential surplus", r.potential], ["Safety approved", r.approved], ["Offered", r.offered],
    ["Accepted", r.accepted], ["Picked up", r.pickedUp], ["Received", r.received],
  ] as const;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><HeartHandshake className="h-4 w-4 text-primary" />Redistribution funnel</CardTitle>
        <CardDescription>Meals at each stage of the rescue workflow.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {steps.map(([l, v], i) => <Bar key={l} label={l} value={v} max={r.potential} strong={i === steps.length - 1} />)}
        <p className="pt-1 text-xs leading-5 text-muted-foreground">
          {r.blockedMeals ? `${r.blockedMeals} meals blocked at the Safety Gate. ` : ""}
          {r.declinedOffers ? `${r.declinedOffers} declined offer${r.declinedOffers === 1 ? "" : "s"} excluded. ` : ""}
          Offered counts active and completed offers; received uses confirmed quantities. Redistribution rate = meals received ÷ surplus identified.
        </p>
      </CardContent>
    </Card>
  );
}

function MealBreakdown({ r }: { r: R }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">By meal</CardTitle>
        <CardDescription>Completed services only.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Meal</TableHead><TableHead className="text-right">Services</TableHead>
            <TableHead className="text-right">Surplus</TableHead><TableHead className="text-right">Redistributed</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {r.byMeal.map((m) => (
              <TableRow key={m.meal}>
                <TableCell>{mealLabel[m.meal]}</TableCell>
                <TableCell className="text-right tabular-nums">{m.services}</TableCell>
                <TableCell className="text-right tabular-nums">{m.potential}</TableCell>
                <TableCell className="text-right tabular-nums">{m.received}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Recipients({ r }: { r: R }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><UsersRound className="h-4 w-4 text-primary" />Recipients served</CardTitle>
        <CardDescription>
          {r.recipients.length} organization{r.recipients.length === 1 ? "" : "s"} · {r.pickupsCompleted} pickup{r.pickupsCompleted === 1 ? "" : "s"} completed · {r.completedReceipts} redistribution{r.completedReceipts === 1 ? "" : "s"} completed
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {r.recipients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No confirmed receipts in this period.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Recipient</TableHead><TableHead className="text-right">Receipts</TableHead><TableHead className="text-right">Meals received</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {r.recipients.map((x) => (
                <TableRow key={x.name}>
                  <TableCell>{x.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{x.receipts}</TableCell>
                  <TableCell className="text-right tabular-nums">{x.meals}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ForecastVsActual({ r }: { r: R }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Forecast vs actual</CardTitle>
        <CardDescription>Saved Demand Planning forecasts compared with completed service actuals. Difference = actual − planned.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {r.comparisons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed service in this period has a saved forecast.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Forecast demand</TableHead><TableHead className="text-right">Consumed</TableHead><TableHead className="text-right">Difference</TableHead>
              <TableHead className="text-right">Recommended prep</TableHead><TableHead className="text-right">Prepared</TableHead><TableHead className="text-right">Difference</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {r.comparisons.map((c) => (
                <TableRow key={`${c.date}-${c.meal}`}>
                  <TableCell className="whitespace-nowrap">{fmtDate(c.date)} · {mealLabel[c.meal]}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.forecast}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.consumed}</TableCell>
                  <TableCell className="text-right tabular-nums">{signed(c.consumed - c.forecast)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.recommended}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.prepared}</TableCell>
                  <TableCell className="text-right tabular-nums">{signed(c.prepared - c.recommended)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function Estimates({ received, hasReceipt }: { received: number; hasReceipt: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Calculator className="h-4 w-4 text-primary" />Estimated impact</CardTitle>
        <CardDescription>Estimate = redistributed meals × configured per-meal assumption. Estimates are not measured values.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {["Financial (estimated)", "Environmental (estimated)", "Social (estimated)"].map((l) => (
          <div key={l} className="rounded-md border border-dashed bg-surface p-4">
            <p className="text-xs font-medium text-muted-foreground">{l}</p>
            <p className="mt-2 text-sm font-medium text-foreground">Impact estimate not configured</p>
            <p className="mt-1 text-xs text-muted-foreground">{hasReceipt ? `${received} meals × assumption not set` : "No per-meal assumption set"}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
