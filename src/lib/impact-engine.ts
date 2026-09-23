import type { ImpactData } from "@/lib/impact.functions";

export type Period = "today" | "7d" | "30d" | "all";
export type Meal = "breakfast" | "lunch" | "dinner";
export const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Period applies to the service date of every record, so all metrics share one window.
export function periodStart(period: Period, now = new Date()): string | null {
  if (period === "all") return null;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - (period === "today" ? 0 : period === "7d" ? 6 : 29));
  return iso(d);
}

const n = (v: number | null | undefined) => (Number.isFinite(v) ? (v as number) : 0);

export function computeImpact(data: ImpactData, period: Period, now = new Date()) {
  const start = periodStart(period, now);
  const inP = (d: string) => !start || d >= start;
  const services = data.services.filter((s) => inP(s.service_date));
  const serviceIds = new Set(services.map((s) => s.id));
  // Only batches from completed services in the period.
  const batches = data.batches.filter((b) => serviceIds.has(b.service_record_id));
  const batchIds = new Set(batches.map((b) => b.id));
  const eligible = new Set(data.verifications.filter((v) => v.outcome === "eligible").map((v) => v.surplus_batch_id));
  const blocked = new Set(data.verifications.filter((v) => v.outcome === "blocked").map((v) => v.surplus_batch_id));
  // Dedupe offers by their persisted id so each redistribution counts exactly once.
  const offers = [...new Map(data.offers.filter((o) => batchIds.has(o.surplus_batch_id)).map((o) => [o.id, o])).values()];
  const done = offers.filter((o) => o.status === "completed");
  const live = offers.filter((o) => o.status !== "declined");

  const prepared = services.reduce((a, s) => a + n(s.prepared_quantity), 0);
  const consumed = services.reduce((a, s) => a + n(s.consumed_quantity), 0);
  const potential = batches.reduce((a, b) => a + n(b.potential_surplus), 0);
  const approved = batches.filter((b) => eligible.has(b.id)).reduce((a, b) => a + n(b.potential_surplus), 0);
  const blockedMeals = batches.filter((b) => blocked.has(b.id)).reduce((a, b) => a + n(b.potential_surplus), 0);
  const offered = live.reduce((a, o) => a + n(o.quantity), 0);
  const accepted = live.filter((o) => ["accepted", "pickup_scheduled", "picked_up", "completed"].includes(o.status)).reduce((a, o) => a + n(o.quantity), 0);
  const pickedUp = live.filter((o) => ["picked_up", "completed"].includes(o.status)).reduce((a, o) => a + n(o.quantity), 0);
  const received = done.reduce((a, o) => a + n(o.received_quantity), 0);
  const declined = offers.filter((o) => o.status === "declined");

  const byMeal = MEALS.map((meal) => {
    const sv = services.filter((s) => s.meal_period === meal);
    const ids = new Set(batches.filter((b) => b.meal_period === meal).map((b) => b.id));
    return {
      meal,
      services: sv.length,
      prepared: sv.reduce((a, s) => a + n(s.prepared_quantity), 0),
      consumed: sv.reduce((a, s) => a + n(s.consumed_quantity), 0),
      potential: batches.filter((b) => ids.has(b.id)).reduce((a, b) => a + n(b.potential_surplus), 0),
      received: done.filter((o) => ids.has(o.surplus_batch_id)).reduce((a, o) => a + n(o.received_quantity), 0),
    };
  }).filter((m) => m.services > 0);

  const recMap = new Map<string, { name: string; meals: number; receipts: number }>();
  for (const o of done) {
    const r = recMap.get(o.recipient_org_id) ?? { name: o.recipient_name, meals: 0, receipts: 0 };
    r.meals += n(o.received_quantity); r.receipts += 1;
    recMap.set(o.recipient_org_id, r);
  }
  const recipients = [...recMap.values()].sort((a, b) => b.meals - a.meals);

  const fc = new Map(data.forecasts.map((f) => [`${f.service_date}|${f.meal_period}`, f]));
  const comparisons = services
    .map((s) => {
      const f = fc.get(`${s.service_date}|${s.meal_period}`);
      if (!f || s.consumed_quantity == null || s.prepared_quantity == null) return null;
      return {
        date: s.service_date, meal: s.meal_period as Meal,
        forecast: f.forecast_demand, consumed: s.consumed_quantity,
        recommended: f.recommended_preparation, prepared: s.prepared_quantity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.meal.localeCompare(b.meal)));

  return {
    servicesCompleted: services.length, prepared, consumed, potential, approved, blockedMeals,
    offered, accepted, pickedUp, received, completedReceipts: done.length, declinedOffers: declined.length,
    pickupsCompleted: live.filter((o) => ["picked_up", "completed"].includes(o.status)).length,
    rate: potential > 0 && done.length > 0 ? received / potential : null,
    rateApproved: approved > 0 && done.length > 0 ? received / approved : null,
    byMeal, recipients, comparisons,
  };
}
