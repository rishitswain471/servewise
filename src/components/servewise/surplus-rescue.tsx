import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HeartHandshake, ListChecks } from "lucide-react";

import { EmptyState, ErrorState, LoadingState, MetricsGrid, StatusIndicator } from "@/components/servewise/page";
import { batchStatus, fmtDateTime, hhmm, offerStatus } from "@/components/servewise/rescue-shared";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRescueOverview } from "@/lib/rescue.functions";

export function useRescueOverview() {
  const fn = useServerFn(getRescueOverview);
  return useQuery({ queryKey: ["rescue-overview"], queryFn: () => fn() });
}

export function SurplusRescueWorkspace() {
  const q = useRescueOverview();
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message="Unable to load surplus batches. Please try again." />;
  const { batches, offers } = q.data;
  const open = batches.filter((b) => ["pending_safety", "available_for_offer", "offered"].includes(b.status) || (b.status === "completed" && b.remaining > 0)).length;
  const pending = batches.filter((b) => b.status === "pending_safety").length;
  const activeOffers = offers.filter((o) => ["sent", "accepted", "pickup_scheduled", "picked_up"].includes(o.status)).length;
  const scheduled = offers.filter((o) => o.status === "pickup_scheduled").length;
  const pickedUp = offers.filter((o) => o.status === "picked_up" || o.status === "completed").length;
  const completed = offers.filter((o) => o.status === "completed").length;
  return (
    <>
      <MetricsGrid metrics={[
        { label: "Open batches", value: String(open), caption: `${batches.length} total · ${completed} completed redistribution${completed === 1 ? "" : "s"}`, tone: open ? "info" : "success" },
        { label: "Pending safety", value: String(pending), caption: "Verification queue", tone: pending ? "warning" : "neutral" },
        { label: "Recipient offers", value: String(activeOffers), caption: activeOffers ? "In progress" : "No offers active" },
        { label: "Pickups", value: String(scheduled), caption: `${scheduled} scheduled · ${pickedUp} completed` },
      ]} />
      <section className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label="Surplus Rescue overview">
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-4 w-4 text-primary" />Surplus batches</CardTitle>
                <CardDescription className="mt-2 leading-6">Potential surplus sent from Service Day. Safety Gate verifies eligibility.</CardDescription>
              </div>
              <StatusIndicator tone={open ? "warning" : "success"} label={open ? `${open} open` : "Queue clear"} compact />
            </div>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <EmptyState title="No batches listed" description="Potential surplus from completed services will appear here." />
            ) : (
              <ul className="divide-y divide-border">
                {batches.map((b) => {
                  const s = batchStatus[b.status] ?? { label: b.status, tone: "neutral" as const };
                  return (
                    <li key={b.id} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{mealLabel[b.meal_period]} · {fmtDate(b.service_date)}</p>
                        <StatusIndicator tone={s.tone} label={s.label} compact />
                      </div>
                      <p className="break-words text-sm text-muted-foreground">{b.menu_name}</p>
                      <p className="text-sm">Potential surplus: <span className="font-semibold">{b.potential_surplus} meals</span> <span className="text-xs text-muted-foreground">({b.prepared_quantity} prepared − {b.consumed_quantity} consumed)</span></p>
                      {b.status !== "pending_safety" && b.status !== "safety_blocked" ? (
                        <p className="text-xs text-muted-foreground">Redistributed {b.redistributed} · Remaining {b.remaining}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-3">
                        <Link to="/service-day" className="text-xs font-medium text-primary">Open source service</Link>
                        {b.status === "pending_safety" ? <Link to="/safety" className="text-xs font-medium text-primary">Review in Safety Gate</Link> : null}
                        {b.remaining > 0 && ["available_for_offer", "offered", "completed"].includes(b.status) ? <Link to="/recipients" className="text-xs font-medium text-primary">Offer to a recipient</Link> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base"><HeartHandshake className="h-4 w-4 text-primary" />Rescue offers</CardTitle>
                <CardDescription className="mt-2 leading-6">Coordinate verified batches with recipient availability and pickup windows.</CardDescription>
              </div>
              <StatusIndicator tone={activeOffers ? "info" : "neutral"} label={activeOffers ? `${activeOffers} active` : "No active pickups"} compact />
            </div>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <EmptyState title="No offers yet" description="Offers to recipients, their responses, pickups and receipts will appear here." />
            ) : <OfferList offers={offers} perspective="kitchen" />}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

export function OfferList({ offers, perspective }: { offers: import("@/lib/rescue.functions").Offer[]; perspective: "kitchen" | "ngo" }) {
  return (
    <ul className="divide-y divide-border">
      {offers.map((o) => {
        const s = offerStatus[o.status] ?? { label: o.status, tone: "neutral" as const };
        return (
          <li key={o.id} className="grid gap-1 py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 break-words text-sm font-semibold">{perspective === "kitchen" ? o.recipient_name : o.kitchen_name}</p>
              <StatusIndicator tone={s.tone} label={s.label} compact />
            </div>
            <p className="break-words text-sm text-muted-foreground">{o.quantity} meals · {o.menu_name} · {mealLabel[o.meal_period]} {fmtDate(o.service_date)}</p>
            <p className="text-xs text-muted-foreground">Pickup window {fmtDate(o.pickup_date)}, {hhmm(o.pickup_from)}–{hhmm(o.pickup_until)}</p>
            {o.pickup_scheduled_at ? <p className="text-xs text-muted-foreground">Pickup: {fmtDateTime(o.pickup_scheduled_at)} · {o.pickup_owner}</p> : null}
            {o.completed_at ? <p className="text-xs text-success">Receipt confirmed: {o.received_quantity} meals · {fmtDateTime(o.received_at)}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
