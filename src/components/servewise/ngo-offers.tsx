import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { NgoEmpty } from "@/components/servewise/ngo-page";
import { ErrorState, LoadingState, MetricsGrid, StatusIndicator } from "@/components/servewise/page";
import { fmtDateTime, hhmm, offerStatus, parseWhole } from "@/components/servewise/rescue-shared";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { advanceOffer, getNgoOverview, type Offer } from "@/lib/rescue.functions";

export function useNgoOverview() {
  const fn = useServerFn(getNgoOverview);
  return useQuery({ queryKey: ["ngo-overview"], queryFn: () => fn() });
}

export function NgoCounters({ offers }: { offers: Offer[] }) {
  const c = (s: string) => offers.filter((o) => o.status === s).length;
  return (
    <MetricsGrid metrics={[
      { label: "Available offers", value: String(c("sent")), caption: "Shared with you", tone: c("sent") ? "info" : "neutral" },
      { label: "Pending response", value: String(c("sent")), caption: "Accept or decline", tone: c("sent") ? "warning" : "neutral" },
      { label: "Accepted", value: String(c("accepted")), caption: "Pickup to schedule" },
      { label: "Pickup scheduled", value: String(c("pickup_scheduled")), caption: `${c("picked_up")} picked up` },
      { label: "Received", value: String(c("completed")), caption: `${offers.filter((o) => o.status === "completed").reduce((s, o) => s + (o.received_quantity ?? 0), 0)} meals`, tone: c("completed") ? "success" : "neutral" },
    ]} />
  );
}

export function NgoOfferQueue({ statuses, emptyTitle, emptyDescription, icon }: { statuses: string[]; emptyTitle: string; emptyDescription: string; icon: LucideIcon }) {
  const q = useNgoOverview();
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message="Unable to load offers. Please try again." />;
  const list = q.data.offers.filter((o) => statuses.includes(o.status));
  if (list.length === 0) return <NgoEmpty icon={icon} title={emptyTitle} description={emptyDescription} />;
  return <div className="grid gap-3">{list.map((o) => <NgoOfferCard key={o.id} offer={o} />)}</div>;
}

function NgoOfferCard({ offer: o }: { offer: Offer }) {
  const qc = useQueryClient();
  const advance = useServerFn(advanceOffer);
  const [when, setWhen] = useState(`${o.pickup_date}T${hhmm(o.pickup_from)}`);
  const [owner, setOwner] = useState(o.pickup_owner ?? "");
  const [notes, setNotes] = useState(o.pickup_notes ?? "");
  const [received, setReceived] = useState(String(o.quantity));
  const [err, setErr] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: async (input: Omit<Parameters<typeof advance>[0]["data"], "offerId">) => {
      const r = await advance({ data: { offerId: o.id, ...input } });
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: () => { setErr(null); toast.success("Offer updated."); qc.invalidateQueries({ queryKey: ["ngo-overview"] }); },
    onError: (e: Error) => setErr(e.message),
  });
  const s = offerStatus[o.status] ?? { label: o.status, tone: "neutral" as const };
  return (
    <article className="grid gap-3 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-foreground">{o.kitchen_name}</p>
          <p className="break-words text-sm text-muted-foreground">{o.menu_name}</p>
        </div>
        <StatusIndicator tone={s.tone} label={s.label} compact />
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Offered</dt><dd className="font-semibold">{o.quantity} meals</dd></div>
        <div><dt className="text-xs text-muted-foreground">Service</dt><dd>{mealLabel[o.meal_period]} · {fmtDate(o.service_date)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Pickup window</dt><dd>{fmtDate(o.pickup_date)}, {hhmm(o.pickup_from)}–{hhmm(o.pickup_until)}</dd></div>
        <div className="sm:col-span-3"><dt className="text-xs text-muted-foreground">Handling</dt><dd className="break-words">{o.handling_info}</dd></div>
        {o.pickup_scheduled_at ? <div className="sm:col-span-3"><dt className="text-xs text-muted-foreground">Pickup</dt><dd className="break-words">{fmtDateTime(o.pickup_scheduled_at)} · {o.pickup_owner}{o.pickup_notes ? ` · ${o.pickup_notes}` : ""}</dd></div> : null}
        {o.completed_at ? <div className="sm:col-span-3"><dt className="text-xs text-muted-foreground">Receipt</dt><dd className="text-success">Confirmed: {o.received_quantity} meals · {fmtDateTime(o.received_at)}</dd></div> : null}
      </dl>
      <p className="text-xs text-muted-foreground">Passed ServeWise operational safety screening by the kitchen — not a food-safety certification.</p>
      {o.status === "sent" ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={m.isPending} onClick={() => m.mutate({ action: "accept" })}>Accept</Button>
          <Button variant="outline" disabled={m.isPending} onClick={() => m.mutate({ action: "decline" })}>Decline</Button>
        </div>
      ) : null}
      {o.status === "accepted" || o.status === "pickup_scheduled" ? (
        <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-3 sm:items-end">
          <div className="grid gap-2"><Label htmlFor={`w-${o.id}`}>Pickup time</Label><Input id={`w-${o.id}`} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor={`o-${o.id}`}>Pickup owner / contact</Label><Input id={`o-${o.id}`} maxLength={200} value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor={`n-${o.id}`}>Notes (optional)</Label><Input id={`n-${o.id}`} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex flex-wrap gap-2 sm:col-span-3">
            <Button variant={o.status === "accepted" ? "default" : "outline"} disabled={m.isPending} onClick={() => {
              if (!owner.trim()) return setErr("Pickup owner is required.");
              if (!when) return setErr("Choose a pickup time.");
              m.mutate({ action: "schedule", when, owner: owner.trim(), notes: notes.trim() || undefined });
            }}>{o.status === "accepted" ? "Schedule pickup" : "Update pickup"}</Button>
            {o.status === "pickup_scheduled" ? <Button disabled={m.isPending} onClick={() => m.mutate({ action: "picked_up" })}>Mark picked up</Button> : null}
          </div>
        </div>
      ) : null}
      {o.status === "picked_up" ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
          <div className="grid gap-2"><Label htmlFor={`r-${o.id}`}>Meals received</Label><Input id={`r-${o.id}`} className="w-32" inputMode="numeric" value={received} onChange={(e) => setReceived(e.target.value)} /></div>
          <Button disabled={m.isPending} onClick={() => {
            const n = parseWhole(received);
            if (n === null || n > o.quantity) return setErr(`Enter a whole number from 0 to ${o.quantity}.`);
            m.mutate({ action: "receive", received: n });
          }}>Confirm receipt</Button>
        </div>
      ) : null}
      {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}
    </article>
  );
}
