import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getImpactAssumptions, saveImpactAssumptions } from "@/lib/impact-assumptions.functions";

const fields = [
  { k: "financial", label: "Financial value per redistributed meal (₹)", max: 100000 },
  { k: "co2e", label: "Environmental estimate per meal (kg CO₂e)", max: 1000 },
  { k: "social", label: "Social impact per meal (meals served)", max: 1000 },
] as const;
type K = (typeof fields)[number]["k"];

export function ImpactAssumptionsForm() {
  const qc = useQueryClient();
  const get = useServerFn(getImpactAssumptions);
  const save = useServerFn(saveImpactAssumptions);
  const q = useQuery({ queryKey: ["impact-assumptions"], queryFn: () => get() });
  const [v, setV] = useState<Record<K, string>>({ financial: "", co2e: "", social: "" });
  useEffect(() => {
    if (q.data) setV({ financial: String(q.data.financial), co2e: String(q.data.co2e), social: String(q.data.social) });
  }, [q.data]);

  const errors = Object.fromEntries(fields.map((f) => {
    const s = v[f.k].trim();
    const n = Number(s);
    return [f.k, s === "" ? "Required" : !Number.isFinite(n) ? "Must be a number" : n < 0 ? "Cannot be negative" : n > f.max ? `Maximum ${f.max}` : null];
  })) as Record<K, string | null>;
  const valid = Object.values(errors).every((e) => !e);

  const m = useMutation({
    mutationFn: () => save({ data: { financial: Number(v.financial), co2e: Number(v.co2e), social: Number(v.social) } }),
    onSuccess: () => {
      toast.success("Impact assumptions saved");
      qc.invalidateQueries({ queryKey: ["impact-assumptions"] });
      qc.invalidateQueries({ queryKey: ["impact-data"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to save impact assumptions."),
  });

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Impact assumptions</CardTitle>
        <CardDescription>
          Configurable per-meal estimates used on Impact. These are illustrative assumptions, not measured or official values.
          {q.data && !q.data.configured ? " Showing default values until you save." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {q.isError ? <p className="text-sm text-destructive">Unable to load impact assumptions.</p> : (
          <form className="grid max-w-2xl gap-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); if (valid) m.mutate(); }}>
            {fields.map((f) => (
              <div key={f.k} className="grid gap-2">
                <Label htmlFor={`ia-${f.k}`}>{f.label}</Label>
                <Input id={`ia-${f.k}`} inputMode="decimal" value={v[f.k]} disabled={q.isLoading}
                  aria-invalid={!!errors[f.k]} onChange={(e) => setV((p) => ({ ...p, [f.k]: e.target.value }))} />
                {errors[f.k] && !q.isLoading ? <p className="text-xs text-destructive">{errors[f.k]}</p> : null}
              </div>
            ))}
            <div className="sm:col-span-3">
              <Button type="submit" disabled={!valid || m.isPending || q.isLoading}>{m.isPending ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
