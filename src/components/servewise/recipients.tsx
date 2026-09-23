import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, HeartHandshake, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState, MetricsGrid, StatusIndicator } from "@/components/servewise/page";
import { foodTypeLabel, hhmm, parseWhole } from "@/components/servewise/rescue-shared";
import { fmtDate, mealLabel } from "@/components/servewise/service-records";
import { OfferList, useRescueOverview } from "@/components/servewise/surplus-rescue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOffer, type Recipient } from "@/lib/rescue.functions";

const today = () => new Date().toLocaleDateString("en-CA");

// Deterministic compatibility — mirrors the database rule that also enforces it.
function compatibility(r: Recipient, qty: number, from: string, until: string, alreadyOffered: boolean) {
  const checks = [
    { ok: r.accepting_offers, text: r.accepting_offers ? "Accepting offers" : "Not accepting offers" },
    { ok: r.accepted_food_types.includes("prepared_meals"), text: r.accepted_food_types.includes("prepared_meals") ? "Accepts prepared meals" : "Does not accept prepared meals" },
    { ok: qty > 0 && qty <= r.capacity_meals, text: `Capacity: ${r.capacity_meals} meals` },
    { ok: from < hhmm(r.pickup_until) && hhmm(r.pickup_from) < until, text: `Pickup window ${hhmm(r.pickup_from)}–${hhmm(r.pickup_until)} ${from < hhmm(r.pickup_until) && hhmm(r.pickup_from) < until ? "compatible" : "does not overlap"}` },
    { ok: !alreadyOffered, text: alreadyOffered ? "Already has an active offer for this batch" : "No active offer for this batch" },
  ];
  return { ok: checks.every((c) => c.ok), checks };
}

export function RecipientsWorkspace() {
  const q = useRescueOverview();
  const qc = useQueryClient();
  const create = useServerFn(createOffer);
  const eligibleBatches = useMemo(
    () => (q.data?.batches ?? []).filter((b) => ["available_for_offer", "offered", "completed"].includes(b.status) && b.remaining > 0),
    [q.data],
  );
  const [batchId, setBatchId] = useState("");
  const [qty, setQty] = useState("");
  const [pickupDate, setPickupDate] = useState(today());
  const [from, setFrom] = useState("14:00");
  const [until, setUntil] = useState("16:00");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!eligibleBatches.find((b) => b.id === batchId)) setBatchId(eligibleBatches[0]?.id ?? "");
  }, [eligibleBatches, batchId]);
  const batch = eligibleBatches.find((b) => b.id === batchId);

  const m = useMutation({
    mutationFn: async (recipientId: string) => {
      const n = parseWhole(qty);
      if (!batch) throw new Error("Select a safety-approved batch.");
      if (n === null || n <= 0) throw new Error("Offered quantity must be a whole number above 0.");
      if (n > batch.remaining) throw new Error(`Only ${batch.remaining} meals remain available.`);
      if (until <= from) throw new Error("Pickup window end must be after start.");
      const r = await create({ data: { batchId: batch.id, recipientId, quantity: n, pickupDate, from, until } });
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: () => { setErr(null); setQty(""); toast.success("Offer sent."); qc.invalidateQueries({ queryKey: ["rescue-overview"] }); },
    onError: (e: Error) => setErr(e.message),
  });

  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message="Unable to load recipients. Please try again." />;
  const { recipients, offers } = q.data;
  const active = offers.filter((o) => ["sent", "accepted", "pickup_scheduled", "picked_up"].includes(o.status));
  const scheduled = offers.filter((o) => o.status === "pickup_scheduled").length;
  const accepting = recipients.filter((r) => r.accepting_offers).length;
  const n = parseWhole(qty) ?? 0;

  return (
    <>
      <MetricsGrid metrics={[
        { label: "Organizations", value: String(recipients.length), caption: "Recipient directory", tone: recipients.length ? "info" : "neutral" },
        { label: "Available today", value: recipients.length ? String(accepting) : "Not configured", caption: recipients.length ? "Accepting offers" : "No recipient profiles yet" },
        { label: "Active offers", value: String(active.length), caption: active.length ? "In progress" : "No offers in progress" },
        { label: "Scheduled pickups", value: String(scheduled), caption: scheduled ? "Awaiting pickup" : "No pickups scheduled" },
      ]} />
      <section className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label="Recipients overview">
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base"><UsersRound className="h-4 w-4 text-primary" />Recipient directory</CardTitle>
                <CardDescription className="mt-2 leading-6">NGO organizations that publish a recipient profile. Offers are only possible for safety-approved surplus.</CardDescription>
              </div>
              <StatusIndicator tone={batch ? "info" : "neutral"} label={batch ? "Batch ready to offer" : "No eligible batch"} compact />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {eligibleBatches.length === 0 ? (
              <p className="rounded-md border border-dashed bg-surface p-3 text-sm text-muted-foreground">No safety-approved surplus is available to offer. Approve a batch in Safety Gate first.</p>
            ) : (
              <div className="grid gap-3 rounded-md border bg-surface p-3">
                <div className="grid gap-2">
                  <Label htmlFor="rc-batch">Safety-approved batch</Label>
                  <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger id="rc-batch"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {eligibleBatches.map((b) => <SelectItem key={b.id} value={b.id}>{mealLabel[b.meal_period]} · {fmtDate(b.service_date)} · {b.remaining} of {b.potential_surplus} remaining</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="grid gap-2"><Label htmlFor="rc-qty">Meals to offer</Label><Input id="rc-qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={batch ? `≤ ${batch.remaining}` : ""} /></div>
                  <div className="grid gap-2"><Label htmlFor="rc-date">Pickup date</Label><Input id="rc-date" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} /></div>
                  <div className="grid gap-2"><Label htmlFor="rc-from">From</Label><Input id="rc-from" type="time" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                  <div className="grid gap-2"><Label htmlFor="rc-until">Until</Label><Input id="rc-until" type="time" value={until} onChange={(e) => setUntil(e.target.value)} /></div>
                </div>
                {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}
              </div>
            )}
            {recipients.length === 0 ? (
              <EmptyState title="No recipients yet" description="NGO organizations appear here once they publish a recipient profile in their Settings." />
            ) : (
              <ul className="divide-y divide-border">
                {recipients.map((r) => {
                  const dup = !!batch && offers.some((o) => o.surplus_batch_id === batch.id && o.status !== "declined" && o.recipient_name === r.display_name);
                  const c = compatibility(r, n || 1, from, until, dup);
                  return (
                    <li key={r.organization_id} className="grid gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="min-w-0 break-words text-sm font-semibold">{r.display_name}</p>
                        <StatusIndicator tone={c.ok ? "success" : "neutral"} label={c.ok ? "Compatible" : "Not compatible"} compact />
                      </div>
                      <p className="break-words text-xs text-muted-foreground">{r.service_area} · {r.accepted_food_types.map((t) => foodTypeLabel[t] ?? t).join(", ")} · Contact: {r.pickup_contact}</p>
                      {batch ? (
                        <ul className="grid gap-1">
                          {c.checks.map((x) => (
                            <li key={x.text} className="flex gap-1.5 text-xs">
                              {x.ok ? <Check className="h-3.5 w-3.5 shrink-0 text-success" /> : <X className="h-3.5 w-3.5 shrink-0 text-destructive" />}{x.text}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {batch ? (
                        <Button size="sm" className="justify-self-start" disabled={!c.ok || m.isPending} onClick={() => m.mutate(r.organization_id)}>
                          Offer {n > 0 ? `${n} meals` : ""}
                        </Button>
                      ) : null}
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
                <CardTitle className="flex items-center gap-2 text-base"><HeartHandshake className="h-4 w-4 text-primary" />Pickup coordination</CardTitle>
                <CardDescription className="mt-2 leading-6">Track offers, responses, pickup windows, and receipt confirmation.</CardDescription>
              </div>
              <StatusIndicator tone={active.length ? "info" : "neutral"} label={active.length ? `${active.length} active` : "No active offers"} compact />
            </div>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? <EmptyState title="No offers yet" description="Offers you send appear here with the recipient's response and pickup progress." /> : <OfferList offers={offers} perspective="kitchen" />}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
