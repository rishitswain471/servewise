import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { METHOD_VERSION, computeForecast, type HistoryRecord } from "@/lib/forecast-engine";
import { mealPeriods } from "@/lib/records.functions";

type Sb = typeof import("@/integrations/supabase/client").supabase;

// Organization always comes from the verified session, never the request.
async function resolveKitchen(supabase: Sb, userId: string) {
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, organizations!inner(org_type)")
    .eq("user_id", userId)
    .eq("role", "admin")
    .eq("organizations.org_type", "kitchen")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.organization_id ?? null;
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.").refine((v) => !Number.isNaN(Date.parse(v)), "Choose a valid date.");
const historySchema = z.object({ meal: z.enum(mealPeriods), beforeDate: date });

async function loadHistory(supabase: Sb, orgId: string, meal: string, beforeDate: string) {
  const { data, error } = await supabase
    .from("service_records")
    .select("id, service_date, menu_name, actual_attendance, consumed_quantity, prepared_quantity")
    .eq("organization_id", orgId)
    .eq("meal_period", meal as (typeof mealPeriods)[number])
    .lt("service_date", beforeDate)
    .order("service_date", { ascending: false })
    .limit(200);
  if (error) {
    console.error("loadHistory failed", error);
    throw new Error("Unable to load historical services.");
  }
  return data.map(
    (r): HistoryRecord => ({
      id: r.id,
      serviceDate: r.service_date,
      menuName: r.menu_name,
      actualAttendance: r.actual_attendance,
      consumedQuantity: r.consumed_quantity,
      preparedQuantity: r.prepared_quantity,
    }),
  );
}

export const getDemandHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => historySchema.parse(i))
  .handler(async ({ data, context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) throw new Error("Demand Lab is available to kitchen admins only.");
    return { records: await loadHistory(context.supabase, orgId, data.meal, data.beforeDate) };
  });

const saveSchema = z.object({
  serviceDate: date,
  meal: z.enum(mealPeriods, { message: "Choose a meal period." }),
  menuName: z.string().trim().min(1, "Menu is required.").max(200),
  expectedAttendance: z.number().int().min(0, "Cannot be negative.").max(1_000_000),
});

// Numbers are recomputed on the server from stored history — client values are never trusted.
export const saveForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => saveSchema.parse(i))
  .handler(async ({ data, context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) return { ok: false as const, error: "Only kitchen admins can save forecasts." };
    const history = await loadHistory(context.supabase, orgId, data.meal, data.serviceDate);
    const r = computeForecast(history, data.serviceDate, data.expectedAttendance);
    if (r.status === "none") return { ok: false as const, error: "Not enough historical data yet." };
    const { error } = await context.supabase.from("demand_forecasts").upsert(
      {
        organization_id: orgId,
        service_date: data.serviceDate,
        meal_period: data.meal,
        menu_name: data.menuName,
        expected_attendance: r.expectedAttendance,
        forecast_demand: r.forecast,
        recommended_preparation: r.preparation,
        buffer: r.buffer,
        consumption_rate: Number(r.rate.toFixed(4)),
        history_count: r.used,
        history_status: r.status,
        method_version: METHOD_VERSION,
      },
      { onConflict: "organization_id,service_date,meal_period" },
    );
    if (error) {
      console.error("saveForecast failed", error);
      return { ok: false as const, error: "Unable to save this forecast." };
    }
    return { ok: true as const, forecast: r.forecast, preparation: r.preparation };
  });

export const listForecasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) throw new Error("Unable to load forecasts.");
    const { data, error } = await context.supabase
      .from("demand_forecasts")
      .select("id, service_date, meal_period, menu_name, expected_attendance, forecast_demand, recommended_preparation, buffer, history_count, history_status, method_version, updated_at")
      .eq("organization_id", orgId)
      .order("service_date", { ascending: false })
      .limit(10);
    if (error) {
      console.error("listForecasts failed", error);
      throw new Error("Unable to load forecasts.");
    }
    return data;
  });

export const deleteForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) return { ok: false as const };
    const { error } = await context.supabase.from("demand_forecasts").delete().eq("id", data.id).eq("organization_id", orgId);
    return { ok: !error };
  });
