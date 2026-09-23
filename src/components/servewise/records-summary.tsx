import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList } from "lucide-react";

import { EmptyState, LoadingState } from "@/components/servewise/page";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecordSummary } from "@/lib/records.functions";

export function OperationalDataSummary() {
  const fetchSummary = useServerFn(getRecordSummary);
  const q = useQuery({ queryKey: ["service-summary"], queryFn: () => fetchSummary() });
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Operational data</CardTitle>
          <CardDescription>Recorded meal services for your kitchen.</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/menu">View records</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {q.isPending ? (
          <LoadingState />
        ) : q.isError ? (
          <div className="flex items-center justify-between gap-3 text-sm text-destructive">
            Unable to load operational data.
            <Button variant="outline" size="sm" onClick={() => q.refetch()}>Retry</Button>
          </div>
        ) : q.data.total === 0 ? (
          <EmptyState icon={ClipboardList} title="No operational data yet." description="Add meal services in Menu & Consumption." />
        ) : (
          <div className="grid gap-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Service records</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{q.data.total.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Coverage</dt>
                <dd className="mt-1 font-medium">
                  {q.data.firstDate && q.data.lastDate
                    ? `${fmtDate(q.data.firstDate)} – ${fmtDate(q.data.lastDate)}`
                    : "—"}
                </dd>
              </div>
            </dl>
            <ul className="divide-y rounded-md border">
              {q.data.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">{fmtDate(r.serviceDate)} · {mealLabel[r.mealPeriod]}</span>{" "}
                    {r.menuName}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {r.consumedQuantity ?? "—"} / {r.preparedQuantity ?? "—"} consumed
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
