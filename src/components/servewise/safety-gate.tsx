import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ShieldCheck, Thermometer, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState, MetricsGrid, StatusIndicator } from "@/components/servewise/page";
import { fmtDateTime, parseWhole } from "@/components/servewise/rescue-shared";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { useRescueOverview } from "@/components/servewise/surplus-rescue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordSafetyCheck, savePolicy } from "@/lib/rescue.functions";

const DEFAULT_POLICY = { max_holding_minutes: 120, min_hot_holding_c: 63, max_cold_holding_c: 5 };

export function SafetyGateWorkspace() {
  const q = useRescueOverview();
  const qc = useQueryClient();
  const record = useServerFn(recordSafetyCheck);
  const [batchId, setBatchId] = useState("");
  const [minutes, setMinutes] = useState("");
  const [mode, setMode] = useState<"hot" | "cold">("hot");
  const [temp, setTemp] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const pendingList = q.data?.batches.filter((b) => b.status === "pending_safety") ?? [];
  useEffect(() => {
    if (!batchId && pendingList[0]) setBatchId(pendingList[0].id);
  }, [batchId, pendingList]);

  const run = useMutation({
    mutationFn: async () => {
      const m = parseWhole(minutes);
      const t = Number(temp);
      if (!batchId) throw new Error("Select a batch.");
      if (m === null) throw new Error("Holding time must be a whole number of minutes.");
      if (temp.trim() === "" || !Number.isFinite(t)) throw new Error("Enter the recorded temperature.");
      const r = await record({ data: { batchId, holdingMinutes: m, storageMode: mode, temperatureC: t, notes: notes.trim() } });
      if (!r.ok) throw new Error(r.error);
      return batchId;
    },
    onSuccess: (id) => {
      setErr(null); setViewId(id); setBatchId(""); setMinutes(""); setTemp(""); setNotes("");
      toast.success("Safety check recorded.");
      qc.invalidateQueries({ queryKey: ["rescue-overview"] });
      qc.invalidateQueries({ queryKey: ["service-day"] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message="Unable to load the verification queue. Please try again." />;
  const { batches, verifications } = q.data;
  const policy = q.data.policy ?? DEFAULT_POLICY;
  const eligible = verifications.filter((v) => v.outcome === "eligible").length;
  const blocked = verifications.length - eligible;
  const shown = verifications.find((v) => v.surplus_batch_id === viewId) ?? verifications[0];
  const shownBatch = shown ? batches.find((b) => b.id === shown.surplus_batch_id) : undefined;

  return (
    <>
      <MetricsGrid metrics={[
        { label: "Awaiting review", value: String(pendingList.length), caption: "Verification queue", tone: pendingList.length ? "warning" : "success" },
        { label: "Eligible", value: String(eligible), caption: eligible ? "Passed screening" : "No completed checks", tone: eligible ? "success" : "neutral" },
        { label: "Blocked", value: String(blocked), caption: blocked ? "Failed screening" : "No completed checks", tone: blocked ? "danger" : "neutral" },
        { label: "Records", value: String(verifications.length), caption: verifications.length ? "Safety checks on file" : "No safety checks" },
      ]} />
      <section className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label="Safety Gate overview">
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base"><Thermometer className="h-4 w-4 text-primary" />Verification inputs</CardTitle>
                <CardDescription className="mt-2 leading-6">Review storage time, holding temperature, and handling notes for each batch.</CardDescription>
              </div>
              <StatusIndicator tone={batchId ? "warning" : "neutral"} label={batchId ? "Batch selected" : "No batch selected"} compact />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {pendingList.length === 0 ? (
              <EmptyState title="No batches awaiting review" description="Surplus sent from Service Day will appear here for verification." />
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="sg-batch">Surplus batch</Label>
                  <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger id="sg-batch"><SelectValue placeholder="Select a batch" /></SelectTrigger>
                    <SelectContent>
                      {pendingList.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{mealLabel[b.meal_period]} · {fmtDate(b.service_date)} · {b.potential_surplus} meals</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(() => { const b = pendingList.find((x) => x.id === batchId); return b ? <p className="break-words text-xs text-muted-foreground">{b.menu_name}</p> : null; })()}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="sg-min">Holding time (min)</Label>
                    <Input id="sg-min" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sg-mode">Holding method</Label>
                    <Select value={mode} onValueChange={(v) => setMode(v as "hot" | "cold")}>
                      <SelectTrigger id="sg-mode"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="hot">Hot-held</SelectItem><SelectItem value="cold">Chilled</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sg-temp">Temperature (°C)</Label>
                    <Input id="sg-temp" inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sg-notes">Handling and storage notes</Label>
                  <Textarea id="sg-notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Covered steel trays in bain-marie; probe checked" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Criteria: holding ≤ {policy.max_holding_minutes} min; hot-held ≥ {Number(policy.min_hot_holding_c)} °C or chilled ≤ {Number(policy.max_cold_holding_c)} °C; handling notes recorded. The outcome is decided by these fixed rules when you submit.
                </p>
                {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}
                <Button disabled={run.isPending || !batchId} onClick={() => run.mutate()}>Run safety screening</Button>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" />Safety status</CardTitle>
                <CardDescription className="mt-2 leading-6">ServeWise operational safety screening — not a government or professional food-safety certification.</CardDescription>
              </div>
              <StatusIndicator tone={shown ? (shown.outcome === "eligible" ? "success" : "danger") : "neutral"} label={shown ? (shown.outcome === "eligible" ? "Eligible" : "Blocked") : "Not evaluated"} compact />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {!shown ? (
              <EmptyState title="No completed checks" description="A completed check shows a clear eligible or blocked outcome with its basis." />
            ) : (
              <>
                {verifications.length > 1 ? (
                  <Select value={shown.surplus_batch_id} onValueChange={setViewId}>
                    <SelectTrigger aria-label="Select record"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {verifications.map((v) => { const b = batches.find((x) => x.id === v.surplus_batch_id); return (
                        <SelectItem key={v.id} value={v.surplus_batch_id}>{b ? `${mealLabel[b.meal_period]} · ${fmtDate(b.service_date)}` : "Batch"} · {v.outcome === "eligible" ? "Eligible" : "Blocked"}</SelectItem>
                      ); })}
                    </SelectContent>
                  </Select>
                ) : null}
                {shownBatch ? <p className="break-words text-sm"><span className="font-semibold">{mealLabel[shownBatch.meal_period]} · {fmtDate(shownBatch.service_date)}</span> · {shownBatch.potential_surplus} meals · <span className="text-muted-foreground">{shownBatch.menu_name}</span></p> : null}
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Basis</p>
                  <ul className="mt-2 grid gap-1.5">
                    {shown.basis.map((x) => (
                      <li key={x.text} className="flex gap-2 text-sm">
                        {x.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                        <span className="min-w-0 break-words">{x.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <dl className="grid gap-2 border-t border-border pt-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Reviewed</dt><dd>{fmtDateTime(shown.reviewed_at)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">Reviewer</dt><dd className="truncate">{shown.reviewer_email ?? "Kitchen admin"}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Handling notes</dt><dd className="break-words">{shown.handling_notes || "—"}</dd></div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </section>
      <PolicyCard policy={policy} configured={!!q.data.policy} />
    </>
  );
}

function PolicyCard({ policy, configured }: { policy: typeof DEFAULT_POLICY; configured: boolean }) {
  const qc = useQueryClient();
  const save = useServerFn(savePolicy);
  const [h, setH] = useState(String(policy.max_holding_minutes));
  const [hot, setHot] = useState(String(Number(policy.min_hot_holding_c)));
  const [cold, setCold] = useState(String(Number(policy.max_cold_holding_c)));
  const m = useMutation({
    mutationFn: async () => {
      const r = await save({ data: { maxHoldingMinutes: Number(h), minHotC: Number(hot), maxColdC: Number(cold) } });
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: () => { toast.success("Safety policy saved."); qc.invalidateQueries({ queryKey: ["rescue-overview"] }); },
    onError: (e: Error) => toast.error(e.message || "Check the values entered."),
  });
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Safety policy</CardTitle>
        <CardDescription className="leading-6">
          {configured ? "Your kitchen's configured screening thresholds." : "Starting values — not configured yet."} Set these to match the food-safety guidance that applies to your kitchen; ServeWise does not certify them.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end">
        <div className="grid gap-2"><Label htmlFor="pol-h">Max holding (min)</Label><Input id="pol-h" inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} /></div>
        <div className="grid gap-2"><Label htmlFor="pol-hot">Min hot-holding (°C)</Label><Input id="pol-hot" inputMode="decimal" value={hot} onChange={(e) => setHot(e.target.value)} /></div>
        <div className="grid gap-2"><Label htmlFor="pol-cold">Max chilled (°C)</Label><Input id="pol-cold" inputMode="decimal" value={cold} onChange={(e) => setCold(e.target.value)} /></div>
        <Button variant="outline" disabled={m.isPending} onClick={() => m.mutate()}>Save policy</Button>
      </CardContent>
    </Card>
  );
}
