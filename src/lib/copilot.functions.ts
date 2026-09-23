import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadAssumptions } from "@/lib/impact-assumptions.functions";
import { computeImpact } from "@/lib/impact-engine";

const SYSTEM = `You are ServeWise Copilot. Use only the verified context supplied by the ServeWise application. Do not invent values. Do not claim information that is not present in the supplied context. If the required information is unavailable, clearly say that it is unavailable ("I don't have enough verified ServeWise data to answer that.").
Rules: You explain; you never calculate or override forecasts, recommended preparation, safety eligibility, recipient eligibility, surplus, redistribution status or impact — quote the values in the context. Impact financial/environmental/social figures are ESTIMATES from configured per-meal assumptions; always call them estimated, never "saved". You have no weather, market price, nutrition or web data. Be concise, operational and factual; use ServeWise terms (forecast, recommended preparation, actual attendance, actual prepared, actual consumed, potential surplus, safety status, recipient, offer, pickup, receipt, redistributed, estimated impact). Today's date is given in the context.`;

const UNAVAILABLE = "Copilot is temporarily unavailable. Your ServeWise operational data is unaffected.";

// Builds a compact, sanitized context for the kitchen resolved from the session.
// No notes, emails, contacts, user IDs or internal IDs are included.
async function buildContext(sb: any, userId: string) {
  const { data: m } = await sb.from("organization_members")
    .select("organization_id, organizations!inner(org_type, name)")
    .eq("user_id", userId).eq("role", "admin").eq("organizations.org_type", "kitchen")
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  const orgId = m?.organization_id;
  if (!orgId) throw new Error("kitchen_only");
  const [s, b, v, o, f] = await Promise.all([
    sb.from("service_records").select("service_date, meal_period, menu_name, expected_attendance, actual_attendance, prepared_quantity, consumed_quantity, service_completed_at")
      .eq("organization_id", orgId).order("service_date", { ascending: false }).limit(200),
    sb.from("surplus_batches").select("id, service_date, meal_period, potential_surplus, status")
      .eq("organization_id", orgId).neq("status", "withdrawn").order("service_date", { ascending: false }).limit(200),
    sb.from("safety_verifications").select("surplus_batch_id, outcome, basis, reviewed_at").eq("organization_id", orgId).limit(200),
    sb.from("recipient_offers").select("id, surplus_batch_id, recipient_org_id, recipient_name, service_date, meal_period, quantity, status, received_quantity")
      .eq("kitchen_org_id", orgId).limit(500),
    sb.from("demand_forecasts").select("service_date, meal_period, expected_attendance, forecast_demand, recommended_preparation, buffer, consumption_rate, history_count, history_status, method_version")
      .eq("organization_id", orgId).order("service_date", { ascending: false }).limit(60),
  ]);
  if (s.error || b.error || v.error || o.error || f.error) throw new Error("context_failed");
  const assumptions = await loadAssumptions(sb, orgId);
  const completed = (s.data ?? []).filter((r: any) => r.service_completed_at);
  const impactInput = {
    assumptions,
    services: completed.map((r: any, i: number) => ({ id: String(i), ...r })),
    batches: b.data ?? [], verifications: v.data ?? [], offers: o.data ?? [], forecasts: f.data ?? [],
  } as any;
  const impactFor = (p: "7d" | "30d" | "all") => {
    const r = computeImpact(impactInput, p);
    return {
      services_completed: r.servicesCompleted, actual_prepared: r.prepared, actual_consumed: r.consumed,
      potential_surplus: r.potential, safety_approved_meals: r.approved, safety_blocked_meals: r.blockedMeals,
      offered: r.offered, accepted: r.accepted, picked_up: r.pickedUp, redistributed_received: r.received,
      completed_receipts: r.completedReceipts, declined_offers: r.declinedOffers,
      redistribution_rate_pct: r.rate == null ? null : Math.round(r.rate * 1000) / 10,
      recipients: r.recipients.map((x) => ({ name: x.name, meals: x.meals })),
      estimated_impact: r.completedReceipts ? {
        financial_inr_estimated: Math.round(r.received * assumptions.financial),
        co2e_kg_estimated: Math.round(r.received * assumptions.co2e * 100) / 100,
        meals_served_estimated: Math.round(r.received * assumptions.social * 100) / 100,
        assumptions_per_meal: { inr: assumptions.financial, co2e_kg: assumptions.co2e, meals_served: assumptions.social, user_configured: assumptions.configured },
      } : null,
    };
  };
  const fc = new Map((f.data ?? []).map((x: any) => [`${x.service_date}|${x.meal_period}`, x]));
  const safety = new Map((v.data ?? []).map((x: any) => [x.surplus_batch_id, x]));
  const batchByKey = new Map((b.data ?? []).map((x: any) => [`${x.service_date}|${x.meal_period}`, x]));
  const offersByBatch = new Map<string, any[]>();
  for (const x of o.data ?? []) offersByBatch.set(x.surplus_batch_id, [...(offersByBatch.get(x.surplus_batch_id) ?? []), x]);
  const recent = (s.data ?? []).slice(0, 12).map((r: any) => {
    const key = `${r.service_date}|${r.meal_period}`;
    const fr: any = fc.get(key); const bt: any = batchByKey.get(key);
    const sv: any = bt ? safety.get(bt.id) : null;
    return {
      service_date: r.service_date, meal: r.meal_period, menu: r.menu_name,
      service_completed: !!r.service_completed_at,
      expected_attendance: r.expected_attendance, actual_attendance: r.actual_attendance,
      actual_prepared: r.prepared_quantity, actual_consumed: r.consumed_quantity,
      saved_forecast: fr ? {
        expected_attendance: fr.expected_attendance, forecast_demand: fr.forecast_demand,
        recommended_preparation: fr.recommended_preparation, buffer: fr.buffer,
        consumption_rate_per_attendee: Number(fr.consumption_rate), history_records: fr.history_count,
        history_status: fr.history_status, method: fr.method_version,
      } : null,
      surplus: bt ? {
        potential_surplus: bt.potential_surplus, batch_status: bt.status,
        safety: sv ? { outcome: sv.outcome, basis: (sv.basis ?? []).map((x: any) => x.text) } : "not yet screened",
        offers: (offersByBatch.get(bt.id) ?? []).map((x: any) => ({ recipient: x.recipient_name, quantity: x.quantity, status: x.status, received: x.received_quantity })),
      } : null,
    };
  });
  const upcoming = (f.data ?? []).filter((x: any) => !completed.some((c: any) => c.service_date === x.service_date && c.meal_period === x.meal_period))
    .slice(0, 6).map((x: any) => ({ service_date: x.service_date, meal: x.meal_period, expected_attendance: x.expected_attendance, forecast_demand: x.forecast_demand, recommended_preparation: x.recommended_preparation, history_status: x.history_status }));
  return {
    today: new Date().toISOString().slice(0, 10),
    kitchen: (m as any).organizations?.name ?? "Kitchen",
    recent_services_newest_first: recent,
    saved_forecasts_without_completed_service: upcoming,
    totals: { last_7_days: impactFor("7d"), last_30_days: impactFor("30d"), all_time: impactFor("all") },
  };
}

const input = z.object({
  question: z.string().trim().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(4000) })).max(8).default([]),
});

export const askCopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ context, data }) => {
    let ctx;
    try { ctx = await buildContext(context.supabase, context.userId); }
    catch (e) {
      if (e instanceof Error && e.message === "kitchen_only") return { ok: false as const, error: "Copilot is available to kitchen admins only." };
      console.error("copilot context failed");
      return { ok: false as const, error: UNAVAILABLE };
    }
    const key = process.env["GEMINI_API_KEY"];
    if (!key) { console.error("copilot: Gemini credential missing"); return { ok: false as const, error: UNAVAILABLE }; }
    const contents = [
      ...data.history.map((h) => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] })),
      { role: "user", parts: [{ text: `Verified ServeWise context (JSON):\n${JSON.stringify(ctx)}\n\nQuestion: ${data.question}` }] },
    ];
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
        }),
      });
      if (!res.ok) { console.error("copilot: Gemini request failed with status", res.status); return { ok: false as const, error: UNAVAILABLE }; }
      const j: any = await res.json();
      const text = (j?.candidates?.[0]?.content?.parts ?? []).map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("").trim();
      if (!text) return { ok: false as const, error: UNAVAILABLE };
      return { ok: true as const, answer: text.slice(0, 6000) };
    } catch {
      console.error("copilot: Gemini request error");
      return { ok: false as const, error: UNAVAILABLE };
    }
  });
