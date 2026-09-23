import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Soup } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState, LoadingState, StatusIndicator } from "@/components/servewise/page";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mealPeriods, type MealPeriod } from "@/lib/records.functions";
import {
  completeService,
  getServiceDay,
  saveServiceActuals,
  sendToSurplusRescue,
} from "@/lib/service-day.functions";
import { cn } from "@/lib/utils";

const STAGES = ["Preparation", "Prepared", "Service", "Actuals", "Surplus review"];

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseQty(v: string): number | null | "invalid" {
  if (v.trim() === "") return null;
  if (!/^\d+$/.test(v.trim())) return "invalid";
  const n = Number(v);
  return n > 1_000_000 ? "invalid" : n;
}

export function ServiceDayWorkspace() {
  const [serviceDate, setServiceDate] = useState(localToday);
  const [meal, setMeal] = useState<MealPeriod>("lunch");
  const fetchDay = useServerFn(getServiceDay);
  const q = useQuery({
    queryKey: ["service-day", serviceDate, meal],
    queryFn: () => fetchDay({ data: { serviceDate, meal } }),
    enabled: /^\d{4}-\d{2}-\d{2}$/.test(serviceDate),
  });

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-[12rem_12rem]" aria-label="Choose service">
        <div className="grid gap-2">
          <Label htmlFor="sd-date">Service date</Label>
          <Input id="sd-date" type="date" value={serviceDate} max={localToday()} onChange={(e) => setServiceDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sd-meal">Meal</Label>
          <Select value={meal} onValueChange={(v) => setMeal(v as MealPeriod)}>
            <SelectTrigger id="sd-meal"><SelectValue /></SelectTrigger>
            <SelectContent>
              {mealPeriods.map((m) => <SelectItem key={m} value={m}>{mealLabel(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>
      {q.isLoading ? <LoadingState /> : q.isError ? (
        <ErrorState message="Unable to load this service. Please try again." />
      ) : q.data ? (
        <ServiceFlow key={`${serviceDate}-${meal}-${q.data.record?.updated_at ?? "new"}`} serviceDate={serviceDate} meal={meal} data={q.data} />
      ) : null}
    </div>
  );
}

type DayData = Awaited<ReturnType<typeof getServiceDay>>;

function ServiceFlow({ serviceDate, meal, data }: { serviceDate: string; meal: MealPeriod; data: DayData }) {
  const { record, forecast, batch } = data;
  const qc = useQueryClient();
  const save = useServerFn(saveServiceActuals);
  const send = useServerFn(sendToSurplusRescue);
  const complete = useServerFn(completeService);
  const completed = !!record?.service_completed_at;

  const autoStage = !record || record.prepared_quantity === null ? 0
    : record.actual_attendance === null ? 2
    : record.consumed_quantity === null ? 3 : 4;
  const [stage, setStage] = useState(autoStage);
  useEffect(() => setStage(autoStage), [autoStage]);

  const [menu, setMenu] = useState(record?.menu_name ?? forecast?.menu_name ?? "");
  const [prepared, setPrepared] = useState(record?.prepared_quantity?.toString() ?? "");
  const [attendance, setAttendance] = useState(record?.actual_attendance?.toString() ?? "");
  const [consumed, setConsumed] = useState(record?.consumed_quantity?.toString() ?? "");
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["service-day"] });
    qc.invalidateQueries({ queryKey: ["surplus-batches"] });
    qc.invalidateQueries({ queryKey: ["service-records"] });
  };
  const run = useMutation({
    mutationFn: async (fn: () => Promise<{ ok: boolean; error?: string }>) => fn(),
    onSuccess: (r) => {
      if (r.ok) { setErr(null); toast.success("Saved."); refresh(); }
      else setErr(r.error ?? "Unable to save.");
    },
    onError: () => setErr("Unable to save. Please try again."),
  });

  function submit(field: "preparedQuantity" | "actualAttendance" | "consumedQuantity", raw: string, label: string) {
    const v = parseQty(raw);
    if (v === null) return setErr(`${label} is required.`);
    if (v === "invalid") return setErr(`${label} must be a whole, non-negative number.`);
    if (!menu.trim()) return setErr("Menu is required.");
    run.mutate(() => save({ data: { serviceDate, meal, menuName: menu.trim(), [field]: v, notes: notes.trim() || null } }));
  }

  const p = record?.prepared_quantity ?? null;
  const c = record?.consumed_quantity ?? null;
  const surplus = p !== null && c !== null ? Math.max(0, p - c) : null;
  const overConsumed = p !== null && c !== null && c > p;
  const batchActive = batch && batch.status !== "withdrawn";
  const done = (i: number) => completed || (i === 0 || i === 1 ? p !== null : i === 2 ? record?.actual_attendance != null : i === 3 ? c !== null : !!batchActive || surplus === 0);

  const summary: [string, string][] = [
    ["Service", `${mealLabel(meal)} · ${fmtDate(serviceDate)}`],
    ["Preparation", p !== null ? "Recorded" : "Awaiting entry"],
    ["Actual attendance", record?.actual_attendance != null ? String(record.actual_attendance) : "Not recorded"],
    ["Actual consumption", c !== null ? `${c} meals` : "Not recorded"],
    ["Surplus", completed ? "Service completed" : batchActive ? "Sent to rescue" : surplus === null ? "Not reviewed" : `${surplus} potential`],
  ];

  return (
    <div className="grid gap-6">
      <section className="border-y border-border py-4" aria-label="Service workflow">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">{fmtDate(serviceDate)} service</h2>
          <Badge variant="outline">{completed ? "Completed" : mealLabel(meal)}</Badge>
        </div>
        <ol className="grid grid-cols-1 gap-1 sm:grid-cols-5">
          {STAGES.map((s, i) => {
            const active = i === stage;
            const reachable = i <= Math.max(autoStage, done(i) ? i : 0) || done(i);
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={!reachable || i === 1}
                  onClick={() => setStage(i)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2 border-l-2 px-3 py-2 text-left sm:border-l-0 sm:border-t-2 disabled:cursor-default",
                    active ? "border-primary bg-primary/8 text-foreground" : done(i) ? "border-success/60 text-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs font-medium",
                    active ? "border-primary bg-primary text-primary-foreground" : done(i) ? "border-success bg-success/10 text-success" : "border-border bg-surface-raised")}>
                    {done(i) && !active ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="text-xs font-medium">{s}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid overflow-hidden rounded-md border bg-surface-raised sm:grid-cols-5" aria-label="Service summary">
        {summary.map(([label, value]) => (
          <div key={label} className="min-w-0 border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <PlanVsActual forecast={forecast} record={record} />

      <section className="grid gap-5 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-labelledby="current-stage-title">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Soup className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase text-primary">Current stage</p>
          </div>
          <h2 id="current-stage-title" className="mt-2 text-xl font-semibold text-foreground">{STAGES[stage]}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {[
              "Record what the kitchen actually prepared for this service.",
              "Preparation is recorded.",
              "Record how many people were actually served.",
              "Record how many meals were actually consumed.",
              "Review potential surplus from actual service data.",
            ][stage]}
          </p>
          {completed ? <p className="mt-3 text-sm text-muted-foreground">This service is completed. Corrections can still be made in Menu &amp; Consumption.</p> : null}
        </div>

        <div className="grid gap-4 rounded-md border bg-surface-raised p-4">
          {stage <= 1 ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="sd-menu">Menu</Label>
                <Input id="sd-menu" value={menu} disabled={completed} maxLength={200} onChange={(e) => setMenu(e.target.value)} placeholder="e.g. Rice, Dal, Vegetables" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sd-prepared">Actual prepared quantity (meals)</Label>
                <Input id="sd-prepared" inputMode="numeric" disabled={completed} value={prepared} onChange={(e) => setPrepared(e.target.value)} placeholder="Enter quantity" />
                {forecast ? <p className="text-xs text-muted-foreground">Recommended: {forecast.recommended_preparation} meals (planning)</p> : null}
              </div>
              {!completed ? <Button disabled={run.isPending} onClick={() => submit("preparedQuantity", prepared, "Actual prepared quantity")}>Save preparation</Button> : null}
            </>
          ) : null}
          {stage === 2 ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="sd-att">Actual attendance</Label>
                <Input id="sd-att" inputMode="numeric" disabled={completed} value={attendance} onChange={(e) => setAttendance(e.target.value)} />
                {forecast ? <p className="text-xs text-muted-foreground">Expected: {forecast.expected_attendance} (planning)</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sd-notes">Service notes (optional)</Label>
                <Textarea id="sd-notes" disabled={completed} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              {!completed ? <Button disabled={run.isPending} onClick={() => submit("actualAttendance", attendance, "Actual attendance")}>Save attendance</Button> : null}
            </>
          ) : null}
          {stage === 3 ? (
            <>
              <p className="text-sm text-muted-foreground">Actually prepared: <span className="font-semibold text-foreground">{p ?? "—"}</span></p>
              <div className="grid gap-2">
                <Label htmlFor="sd-cons">Actual consumed quantity (meals)</Label>
                <Input id="sd-cons" inputMode="numeric" disabled={completed} value={consumed} onChange={(e) => setConsumed(e.target.value)} />
              </div>
              {p !== null && parseQty(consumed) !== null && typeof parseQty(consumed) === "number" && (parseQty(consumed) as number) > p ? (
                <p className="flex gap-2 text-xs text-warning-foreground"><AlertTriangle className="h-4 w-4 shrink-0" />Consumed is higher than prepared. Check both values; the entry will be saved as typed.</p>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="sd-notes2">Operational notes (optional)</Label>
                <Textarea id="sd-notes2" disabled={completed} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              {!completed ? <Button disabled={run.isPending} onClick={() => submit("consumedQuantity", consumed, "Actual consumed quantity")}>Save consumption</Button> : null}
            </>
          ) : null}
          {stage === 4 && record && surplus !== null ? (
            <>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-xs text-muted-foreground">Prepared</dt><dd className="font-semibold">{p}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Consumed</dt><dd className="font-semibold">{c}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Potential surplus</dt><dd className="font-semibold">{surplus}</dd></div>
              </dl>
              {overConsumed ? <p className="flex gap-2 text-xs text-warning-foreground"><AlertTriangle className="h-4 w-4 shrink-0" />Consumed exceeds prepared, so there is no surplus. Check the recorded values.</p> : null}
              {surplus > 0 ? (
                <p className="text-sm text-muted-foreground">{surplus} meals may be available for rescue, subject to safety verification.</p>
              ) : <p className="text-sm text-muted-foreground">No potential surplus from this service.</p>}
              {surplus > 0 && batchActive ? (
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <StatusIndicator tone="warning" label="Pending safety verification" compact />
                  <Link to="/surplus" className="text-sm font-medium text-primary">View</Link>
                </div>
              ) : null}
              {!completed && surplus > 0 && !batchActive ? (
                <Button disabled={run.isPending} onClick={() => run.mutate(() => send({ data: { recordId: record.id } }))}>Send to Surplus Rescue</Button>
              ) : null}
              {!completed && record.actual_attendance !== null ? (
                <Button variant="outline" disabled={run.isPending || (surplus > 0 && !batchActive)} onClick={() => run.mutate(() => complete({ data: { recordId: record.id } }))}>Complete service</Button>
              ) : null}
            </>
          ) : null}
          {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Preparation status</span>
            <StatusIndicator tone={p !== null ? "success" : "neutral"} label={p !== null ? "Recorded" : "Awaiting entry"} compact />
          </div>
        </div>
      </section>
    </div>
  );
}

function PlanVsActual({ forecast, record }: { forecast: DayData["forecast"]; record: DayData["record"] }) {
  const cell = (label: string, value: number | null | undefined, unit = "meals") => (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value ?? "—"}{value != null && unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}</p>
    </div>
  );
  const c = record?.consumed_quantity ?? null;
  const p = record?.prepared_quantity ?? null;
  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Planned versus actual">
      <div className="rounded-md border p-4">
        <p className="mb-3 text-xs font-semibold uppercase text-info">Planning (forecast)</p>
        {forecast ? (
          <div className="grid grid-cols-3 gap-3">
            {cell("Expected attendance", forecast.expected_attendance, "")}
            {cell("Forecast", forecast.forecast_demand)}
            {cell("Recommended", forecast.recommended_preparation)}
          </div>
        ) : <p className="text-sm text-muted-foreground">No saved forecast for this service. Actuals can still be recorded manually.</p>}
      </div>
      <div className="rounded-md border p-4">
        <p className="mb-3 text-xs font-semibold uppercase text-success">Actual</p>
        <div className="grid grid-cols-3 gap-3">
          {cell("Actual attendance", record?.actual_attendance, "")}
          {cell("Actual prepared", p)}
          {cell("Actual consumed", c)}
        </div>
        {c !== null ? (
          <div className="mt-3 grid gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
            {forecast ? <p>Consumed vs forecast: {c} − {forecast.forecast_demand} = {c - forecast.forecast_demand} meals</p> : null}
            {p !== null ? <p>Prepared vs consumed: {p} − {c} = {p - c} meals</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
