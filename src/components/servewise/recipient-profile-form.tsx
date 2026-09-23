import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useNgoOverview } from "@/components/servewise/ngo-offers";
import { ErrorState, LoadingState, StatusIndicator } from "@/components/servewise/page";
import { foodTypeLabel, hhmm, parseWhole } from "@/components/servewise/rescue-shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveRecipientProfile } from "@/lib/rescue.functions";

type Food = "prepared_meals" | "packaged_food" | "produce";
const FOODS: Food[] = ["prepared_meals", "packaged_food", "produce"];

export function RecipientProfileForm() {
  const q = useNgoOverview();
  const qc = useQueryClient();
  const save = useServerFn(saveRecipientProfile);
  const [area, setArea] = useState("");
  const [cap, setCap] = useState("");
  const [from, setFrom] = useState("13:00");
  const [until, setUntil] = useState("17:00");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [accepting, setAccepting] = useState(true);
  const [foods, setFoods] = useState<Food[]>(["prepared_meals"]);
  const [err, setErr] = useState<string | null>(null);
  const p = q.data?.profile;
  useEffect(() => {
    if (!p) return;
    setArea(p.service_area); setCap(String(p.capacity_meals)); setFrom(hhmm(p.pickup_from)); setUntil(hhmm(p.pickup_until));
    setContact(p.pickup_contact); setNotes(p.pickup_notes ?? ""); setAccepting(p.accepting_offers);
    setFoods(p.accepted_food_types.filter((f): f is Food => (FOODS as string[]).includes(f)));
  }, [p]);
  const m = useMutation({
    mutationFn: async () => {
      const c = parseWhole(cap);
      if (!area.trim()) throw new Error("Service area is required.");
      if (c === null) throw new Error("Capacity must be a whole number.");
      if (until <= from) throw new Error("Pickup window end must be after start.");
      if (!contact.trim()) throw new Error("Pickup contact is required.");
      if (!foods.length) throw new Error("Choose at least one food type.");
      const r = await save({ data: { serviceArea: area.trim(), capacity: c, from, until, contact: contact.trim(), notes: notes.trim(), accepting, foodTypes: foods } });
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: () => { setErr(null); toast.success("Recipient profile saved."); qc.invalidateQueries({ queryKey: ["ngo-overview"] }); },
    onError: (e: Error) => setErr(e.message),
  });
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState message="Unable to load your recipient profile." />;
  return (
    <section className="grid gap-4 rounded-lg border bg-card p-4 sm:p-5" aria-label="Recipient profile">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recipient profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Kitchens see only this information when matching surplus. Your other data stays private.</p>
        </div>
        <StatusIndicator tone={p ? "success" : "neutral"} label={p ? "Published" : "Not configured"} compact />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="rp-area">Service area</Label><Input id="rp-area" maxLength={200} value={area} onChange={(e) => setArea(e.target.value)} /></div>
        <div className="grid gap-2"><Label htmlFor="rp-cap">Capacity per pickup (meals)</Label><Input id="rp-cap" inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value)} /></div>
        <div className="grid gap-2"><Label htmlFor="rp-from">Pickup from</Label><Input id="rp-from" type="time" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="grid gap-2"><Label htmlFor="rp-until">Pickup until</Label><Input id="rp-until" type="time" value={until} onChange={(e) => setUntil(e.target.value)} /></div>
        <div className="grid gap-2"><Label htmlFor="rp-contact">Pickup contact</Label><Input id="rp-contact" maxLength={200} value={contact} onChange={(e) => setContact(e.target.value)} /></div>
        <div className="grid gap-2"><Label htmlFor="rp-notes">Pickup preferences (optional)</Label><Input id="rp-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-2 text-sm font-medium">Accepted food types</legend>
        {FOODS.map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm">
            <Checkbox checked={foods.includes(f)} onCheckedChange={(v) => setFoods((cur) => (v ? [...cur, f] : cur.filter((x) => x !== f)))} />
            {foodTypeLabel[f]}
          </label>
        ))}
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={accepting} onCheckedChange={(v) => setAccepting(!!v)} />Accepting offers now</label>
      {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}
      <Button className="justify-self-start" disabled={m.isPending} onClick={() => m.mutate()}>Save profile</Button>
    </section>
  );
}
