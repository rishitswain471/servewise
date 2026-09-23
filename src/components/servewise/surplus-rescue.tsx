import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HeartHandshake, ListChecks } from "lucide-react";

import { EmptyState, ErrorState, LoadingState, MetricsGrid, ProductPanel, StatusIndicator } from "@/components/servewise/page";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listSurplusBatches } from "@/lib/service-day.functions";

const statusLabel: Record<string, string> = { pending_safety: "Pending safety verification" };

export function SurplusRescueWorkspace() {
  const list = useServerFn(listSurplusBatches);
  const q = useQuery({ queryKey: ["surplus-batches"], queryFn: () => list() });
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message="Unable to load surplus batches. Please try again." />;
  const batches = q.data;
  const pending = batches.filter((b) => b.status === "pending_safety").length;
  return (
    <>
      <MetricsGrid metrics={[
        { label: "Open batches", value: String(batches.length), caption: batches.length ? "From completed services" : "No batches listed", tone: batches.length ? "info" : "success" },
        { label: "Awaiting safety", value: String(pending), caption: "Verification queue", tone: pending ? "warning" : "neutral" },
        { label: "Recipient offers", value: "0", caption: "No offers active" },
        { label: "Pickups", value: "0", caption: "No pickups scheduled" },
      ]} />
      <section className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label="Surplus Rescue overview">
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-4 w-4 text-primary" />Surplus batches</CardTitle>
                <CardDescription className="mt-2 leading-6">Potential surplus sent from Service Day. Safety Gate verifies eligibility.</CardDescription>
              </div>
              <StatusIndicator tone={batches.length ? "warning" : "success"} label={batches.length ? `${batches.length} open` : "Queue clear"} compact />
            </div>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <EmptyState title="No batches listed" description="Potential surplus from completed services will appear here." />
            ) : (
              <ul className="divide-y divide-border">
                {batches.map((b) => (
                  <li key={b.id} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{mealLabel[b.meal_period]} · {fmtDate(b.service_date)}</p>
                      <StatusIndicator tone="warning" label={statusLabel[b.status] ?? b.status} compact />
                    </div>
                    <p className="break-words text-sm text-muted-foreground">{b.menu_name}</p>
                    <p className="text-sm">Potential surplus: <span className="font-semibold">{b.potential_surplus} meals</span> <span className="text-xs text-muted-foreground">({b.prepared_quantity} prepared − {b.consumed_quantity} consumed)</span></p>
                    <Link to="/service-day" className="text-xs font-medium text-primary">Open source service</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <ProductPanel section={{ title: "Rescue coordination", description: "Coordinate verified batches with recipient availability and pickup windows.", icon: HeartHandshake, status: "No active pickups", items: ["Recipient response", "Pickup window", "Receipt confirmation"] }} />
      </section>
    </>
  );
}
