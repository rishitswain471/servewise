import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays } from "lucide-react";

import { EmptyState, ErrorState, LoadingState, MetricsGrid, StatusIndicator, type StatusTone } from "@/components/servewise/page";
import { batchStatus, offerStatus } from "@/components/servewise/rescue-shared";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeImpact, MEALS } from "@/lib/impact-engine";
import { getImpactData } from "@/lib/impact.functions";
import { getRescueOverview } from "@/lib/rescue.functions";
import { getServiceDay } from "@/lib/service-day.functions";

const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString());

// View layer only: every number comes from the existing C3–C7 functions and engines.
export function TodaysKitchen() {
  const today = new Date().toLocaleDateString("en-CA");
  const getDay = useServerFn(getServiceDay);
  const getRescue = useServerFn(getRescueOverview);
  const getImpact = useServerFn(getImpactData);
  const days = useQueries({
    queries: MEALS.map((meal) => ({
      queryKey: ["service-day", today, meal],
      queryFn: () => getDay({ data: { serviceDate: today, meal } }),
    })),
  });
  const rescue = useQuery({ queryKey: ["rescue-overview"], queryFn: () => getRescue() });
  const impact = useQuery({ queryKey: ["impact-data"], queryFn: () => getImpact() });

  if (days.some((d) => d.isPending) || rescue.isPending || impact.isPending) return <LoadingState />;
  const err = days.find((d) => d.isError)?.error ?? rescue.error ?? impact.error;
  if (err) return <ErrorState message={err instanceof Error ? err.message : "Please try again."} />;

  const rows = MEALS.map((meal, i) => ({ meal, ...days[i]!.data! }));
  const active = rows.filter((r) => r.record || r.forecast);
  const t = computeImpact(impact.data!, "today");
  const all = computeImpact(impact.data!, "all");
  const sum = (f: (r: (typeof rows)[number]) => number | null | undefined) => {
    const v = rows.map(f).filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) : null;
  };
  const forecast = sum((r) => r.forecast?.forecast_demand);
  const recommended = sum((r) => r.forecast?.recommended_preparation);
  const prepared = sum((r) => r.record?.prepared_quantity);
  const consumed = sum((r) => r.record?.consumed_quantity);
  const completed = rows.filter((r) => r.record?.service_completed_at).length;
  const batches = rescue.data!.batches;
  const pending = batches.filter((b) => b.status === "pending_safety").length;
  const openOffers = rescue.data!.offers.filter((o) => !["declined", "completed"].includes(o.status));

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <MetricsGrid metrics={[
        { label: "Today’s forecast", value: forecast == null ? "Not planned" : `${fmt(forecast)} meals`,
          caption: recommended == null ? "No saved forecast" : `Prepare ${fmt(recommended)}`, tone: forecast == null ? "neutral" : "info" },
        { label: "Prepared / consumed", value: prepared == null ? "Not recorded" : `${fmt(prepared)} / ${fmt(consumed)}`,
          caption: `${completed} of ${active.length || 0} services completed`, tone: completed && completed === active.length ? "success" : "neutral" },
        { label: "Potential surplus today", value: `${fmt(t.potential)} meals`,
          caption: pending ? `${pending} batch${pending > 1 ? "es" : ""} awaiting safety` : "No batches awaiting safety", tone: pending ? "warning" : "success" },
        { label: "Redistributed today", value: `${fmt(t.received)} meals`,
          caption: `${fmt(all.received)} confirmed received overall`, tone: t.received ? "success" : "neutral" },
      ]} />

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Today’s services</CardTitle>
            <CardDescription>{fmtDate(today)}</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/service-day">Open Service Day</Link></Button>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="grid gap-3">
              <EmptyState icon={CalendarDays} title="Nothing planned or recorded for today."
                description="Save a forecast in Demand Planning, or record today’s service in Service Day." />
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild size="sm"><Link to="/demand">Plan demand</Link></Button>
                <Button asChild size="sm" variant="outline"><Link to="/service-day">Record service</Link></Button>
              </div>
            </div>
          ) : (
            <ul className="grid gap-3">
              {active.map((r) => <ServiceRow key={r.meal} row={r} offers={rescue.data!.offers} />)}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Surplus rescue</CardTitle>
            <CardDescription>Open work across all dates.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/surplus">Open Surplus Rescue</Link></Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Stat label="Awaiting safety" value={pending} to="/safety" />
            <Stat label="Available for offer" value={batches.filter((b) => b.status === "available_for_offer" && b.remaining > 0).length} to="/recipients" />
            <Stat label="Active offers" value={openOffers.length} to="/surplus" />
            <Stat label="Blocked" value={batches.filter((b) => b.status === "safety_blocked").length} to="/safety" />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, to }: { label: string; value: number; to: "/safety" | "/recipients" | "/surplus" }) {
  return (
    <Link to={to} className="rounded-md border p-3 hover:bg-muted/50">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
    </Link>
  );
}

type Row = Awaited<ReturnType<typeof getServiceDay>> & { meal: (typeof MEALS)[number] };
type Offers = Awaited<ReturnType<typeof getRescueOverview>>["offers"];

function ServiceRow({ row, offers }: { row: Row; offers: Offers }) {
  const { record, forecast, batch } = row;
  const done = !!record?.service_completed_at;
  const surplus = record?.prepared_quantity != null && record.consumed_quantity != null
    ? Math.max(0, record.prepared_quantity - record.consumed_quantity) : null;
  const batchOffers = batch ? offers.filter((o) => o.surplus_batch_id === batch.id && o.status !== "declined") : [];
  const latest = batchOffers[0];
  let status: { label: string; tone: StatusTone } = done
    ? { label: "Service completed", tone: "success" }
    : record ? { label: "In progress", tone: "info" } : { label: "Planned", tone: "neutral" };
  let next: { label: string; to: "/service-day" | "/safety" | "/recipients" | "/surplus" } | null =
    done ? null : { label: record ? "Continue service" : "Start service", to: "/service-day" };
  if (batch) {
    status = latest && batch.status !== "completed"
      ? offerStatus[latest.status] ?? status
      : batchStatus[batch.status] ?? { label: batch.status.replace(/_/g, " "), tone: "info" };
    next = batch.status === "pending_safety" ? { label: "Run safety check", to: "/safety" }
      : batch.status === "available_for_offer" ? { label: "Offer to recipient", to: "/recipients" }
      : latest && batch.status !== "completed" ? { label: "Track offer", to: "/surplus" } : null;
  } else if (done && surplus) {
    next = { label: "Send to Surplus Rescue", to: "/service-day" };
  }
  return (
    <li className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium">
          {mealLabel[row.meal]} <span className="text-muted-foreground">· {record?.menu_name ?? forecast?.menu_name}</span>
        </p>
        <StatusIndicator label={status.label} tone={status.tone} compact />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Expected", record?.expected_attendance ?? forecast?.expected_attendance],
          ["Forecast", forecast?.forecast_demand],
          ["Recommended", forecast?.recommended_preparation],
          ["Prepared", record?.prepared_quantity],
          ["Consumed", record?.consumed_quantity],
          ["Potential surplus", batch?.potential_surplus ?? surplus],
        ].map(([l, v]) => (
          <div key={l as string}>
            <dt className="text-xs text-muted-foreground">{l}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{fmt(v as number | null | undefined)}</dd>
          </div>
        ))}
      </dl>
      {!forecast ? <p className="mt-2 text-xs text-muted-foreground">No saved forecast for this service.</p> : null}
      {next ? (
        <Button asChild size="sm" variant="outline" className="mt-3"><Link to={next.to}>{next.label}</Link></Button>
      ) : null}
    </li>
  );
}
