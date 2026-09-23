import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState, StatusIndicator } from "@/components/servewise/page";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { METHOD_VERSION, MIN_HISTORY, computeForecast, explainForecast } from "@/lib/forecast-engine";
import { deleteForecast, getDemandHistory, listForecasts, saveForecast } from "@/lib/forecast.functions";
import { mealPeriods, type MealPeriod } from "@/lib/records.functions";

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA");
};

export function DemandLab() {
  const [serviceDate, setServiceDate] = useState(tomorrow);
  const [meal, setMeal] = useState<MealPeriod>("lunch");
  const [menuName, setMenuName] = useState("");
  const [attendanceText, setAttendanceText] = useState("");
  const [adjust, setAdjust] = useState(0);

  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(serviceDate) && !Number.isNaN(Date.parse(serviceDate));
  const attendance = /^\d+$/.test(attendanceText) ? Number(attendanceText) : null;
  const attendanceError =
    attendanceText === "" ? null : attendance == null ? "Enter a whole, non-negative number." : attendance > 1_000_000 ? "Value is too large." : null;
  const scenarioAttendance = attendance == null ? null : Math.max(0, Math.round(attendance * (1 + adjust / 100)));

  const fetchHistory = useServerFn(getDemandHistory);
  // History loads once per meal + date; slider and attendance changes recalculate locally.
  const history = useQuery({
    queryKey: ["demand-history", meal, serviceDate],
    queryFn: () => fetchHistory({ data: { meal, beforeDate: serviceDate } }),
    enabled: dateValid,
    staleTime: 60_000,
  });

  const result = useMemo(
    () =>
      history.data && scenarioAttendance != null && !attendanceError
        ? computeForecast(history.data.records, serviceDate, scenarioAttendance)
        : null,
    [history.data, scenarioAttendance, serviceDate, attendanceError],
  );
  const explanation = result ? explainForecast(result, mealLabel[meal].toLowerCase()) : [];

  const qc = useQueryClient();
  const save = useServerFn(saveForecast);
  const saveM = useMutation({
    mutationFn: () =>
      save({ data: { serviceDate, meal, menuName: menuName.trim(), expectedAttendance: scenarioAttendance! } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Forecast saved.");
        qc.invalidateQueries({ queryKey: ["forecasts"] });
      } else toast.error(r.error);
    },
    onError: () => toast.error("Unable to save this forecast."),
  });
  const canSave = dateValid && menuName.trim().length > 0 && result != null && result.status !== "none";

  return (
    <div className="grid min-w-0 gap-6">
      <header className="border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Plan</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Demand Lab</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Forecast demand and preparation for an upcoming service from your recorded history.
        </p>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Plan a service</CardTitle>
            <CardDescription>Uses only your kitchen’s past records.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="dl-date">Service date</Label>
              <Input id="dl-date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
              {!dateValid && <p className="text-xs text-destructive">Choose a valid date.</p>}
            </div>
            <div className="grid gap-1.5">
              <Label>Meal</Label>
              <Select value={meal} onValueChange={(v) => setMeal(v as MealPeriod)}>
                <SelectTrigger aria-label="Meal"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mealPeriods.map((m) => (
                    <SelectItem key={m} value={m}>{mealLabel[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dl-menu">Menu</Label>
              <Input id="dl-menu" maxLength={200} value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="e.g. Rice meal set" />
              {menuName.trim() === "" && <p className="text-xs text-muted-foreground">Menu is required to save.</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dl-att">Expected attendance</Label>
              <Input id="dl-att" inputMode="numeric" value={attendanceText} onChange={(e) => setAttendanceText(e.target.value.trim())} placeholder="e.g. 500" />
              {attendanceError && <p className="text-xs text-destructive">{attendanceError}</p>}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <Label>Attendance adjustment</Label>
                <span className="tabular-nums text-muted-foreground">
                  {adjust > 0 ? "+" : ""}{adjust}%{scenarioAttendance != null ? ` · ${scenarioAttendance.toLocaleString()}` : ""}
                </span>
              </div>
              <Slider aria-label="Attendance adjustment" min={-30} max={30} step={1} value={[adjust]} onValueChange={([v]) => setAdjust(v ?? 0)} disabled={attendance == null} />
              <p className="text-xs text-muted-foreground">What-if only. Historical records are never changed.</p>
            </div>
            <Button disabled={!canSave || saveM.isPending} onClick={() => saveM.mutate()}>
              {saveM.isPending ? "Saving…" : "Save forecast"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-6">
          {!dateValid ? (
            <EmptyState icon={BarChart3} title="Choose a service date." description="The forecast uses services recorded before this date." />
          ) : history.isPending ? (
            <Card><CardContent className="pt-6"><LoadingState /></CardContent></Card>
          ) : history.isError ? (
            <ErrorState message="Historical services couldn’t be loaded. Please try again." />
          ) : history.data.records.length === 0 || result?.status === "none" ? (
            <EmptyState icon={BarChart3} title="Not enough historical data yet." description={`Record past ${mealLabel[meal].toLowerCase()} services with actual attendance and consumption in Menu & Consumption.`} />
          ) : !result ? (
            <EmptyState icon={BarChart3} title="Enter expected attendance." description={`${history.data.records.length} past ${mealLabel[meal].toLowerCase()} records are available for this forecast.`} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Forecast demand" value={result.forecast} unit="meals" />
                <Stat label="Operational buffer" value={result.buffer} unit="meals" />
                <Stat label="Recommended preparation" value={result.preparation} unit="meals" strong />
              </div>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-base">Why this number?</CardTitle>
                    <CardDescription>Method {METHOD_VERSION}</CardDescription>
                  </div>
                  <StatusIndicator
                    label={result.status === "sufficient" ? "Sufficient history" : "Limited history"}
                    tone={result.status === "sufficient" ? "success" : "warning"}
                  />
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 text-sm leading-6">
                    {explanation.map((l) => (
                      <li key={l} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{l}</li>
                    ))}
                  </ul>
                  {result.status === "limited" && (
                    <p className="mt-3 text-xs text-muted-foreground">At least {MIN_HISTORY} comparable services are needed for a history-based buffer.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historical basis</CardTitle>
                  <CardDescription>Comparable {mealLabel[meal].toLowerCase()} services used, most recent first.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr><th className="py-2 font-medium">Date</th><th className="font-medium">Menu</th><th className="text-right font-medium">Per attendee</th><th className="text-right font-medium">Weight</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.samples.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 whitespace-nowrap">{fmtDate(s.serviceDate)}</td>
                          <td className="max-w-[200px] truncate">{s.menuName}</td>
                          <td className="text-right tabular-nums">{s.rate.toFixed(3)}</td>
                          <td className="text-right tabular-nums">{s.weight.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
          <SavedForecasts />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, strong }: { label: string; value: number; unit: string; strong?: boolean }) {
  return (
    <Card className={strong ? "border-primary/40" : undefined}>
      <CardContent className="pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{unit}</p>
      </CardContent>
    </Card>
  );
}

function SavedForecasts() {
  const list = useServerFn(listForecasts);
  const del = useServerFn(deleteForecast);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["forecasts"], queryFn: () => list() });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saved forecasts</CardTitle>
        <CardDescription>Planning scenarios, kept separate from recorded services.</CardDescription>
      </CardHeader>
      <CardContent>
        {q.isPending ? <LoadingState /> : q.isError ? <ErrorState message="Saved forecasts couldn’t be loaded." /> : q.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved forecasts yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {q.data.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="text-muted-foreground">{fmtDate(f.service_date)} · {mealLabel[f.meal_period]}</span> {f.menu_name}
                </span>
                <span className="flex items-center gap-3 tabular-nums">
                  {f.forecast_demand} forecast · {f.recommended_preparation} prepare
                  <Button variant="ghost" size="icon" aria-label="Delete forecast" onClick={async () => { await del({ data: { id: f.id } }); qc.invalidateQueries({ queryKey: ["forecasts"] }); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
