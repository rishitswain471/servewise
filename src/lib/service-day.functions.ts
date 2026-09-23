import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TablesUpdate } from "@/integrations/supabase/types";
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

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Choose a valid date.");
const qty = z
  .number({ message: "Enter a whole number." })
  .int("Enter a whole number.")
  .min(0, "Cannot be negative.")
  .max(1_000_000, "Value is too large.");
const keySchema = z.object({ serviceDate: date, meal: z.enum(mealPeriods) });

const RECORD_COLS =
  "id, service_date, meal_period, menu_name, expected_attendance, actual_attendance, prepared_quantity, consumed_quantity, notes, service_completed_at, updated_at";

export const getServiceDay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => keySchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const orgId = await resolveKitchen(sb, context.userId);
    if (!orgId) throw new Error("Service Day is available to kitchen admins only.");
    const [rec, fc] = await Promise.all([
      sb.from("service_records").select(RECORD_COLS).eq("organization_id", orgId)
        .eq("service_date", data.serviceDate).eq("meal_period", data.meal).maybeSingle(),
      sb.from("demand_forecasts")
        .select("menu_name, expected_attendance, forecast_demand, recommended_preparation, buffer, updated_at")
        .eq("organization_id", orgId).eq("service_date", data.serviceDate)
        .eq("meal_period", data.meal).maybeSingle(),
    ]);
    if (rec.error || fc.error) {
      console.error("getServiceDay failed", rec.error ?? fc.error);
      throw new Error("Unable to load this service.");
    }
    let batch = null;
    if (rec.data) {
      const b = await sb.from("surplus_batches")
        .select("id, potential_surplus, status, created_at")
        .eq("service_record_id", rec.data.id).maybeSingle();
      batch = b.data;
    }
    return { record: rec.data, forecast: fc.data, batch };
  });

const saveSchema = keySchema.extend({
  menuName: z.string().trim().min(1, "Menu is required.").max(200),
  preparedQuantity: qty.optional(),
  actualAttendance: qty.optional(),
  consumedQuantity: qty.optional(),
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters.").nullable().optional(),
});

type Result = { ok: true } | { ok: false; error: string };

// Progressive save of ACTUAL values into the existing C3 service record.
// Planning values (C4 forecast) are never written here.
export const saveServiceActuals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => saveSchema.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const sb = context.supabase;
    const orgId = await resolveKitchen(sb, context.userId);
    if (!orgId) return { ok: false, error: "Only kitchen admins can record services." };
    const existing = await sb.from("service_records").select("id, service_completed_at")
      .eq("organization_id", orgId).eq("service_date", data.serviceDate)
      .eq("meal_period", data.meal).maybeSingle();
    if (existing.data?.service_completed_at)
      return { ok: false, error: "This service is completed and can no longer be edited here." };
    const patch: TablesUpdate<"service_records"> = { menu_name: data.menuName };
    if (data.preparedQuantity !== undefined) patch.prepared_quantity = data.preparedQuantity;
    if (data.actualAttendance !== undefined) patch.actual_attendance = data.actualAttendance;
    if (data.consumedQuantity !== undefined) patch.consumed_quantity = data.consumedQuantity;
    if (data.notes !== undefined) patch.notes = data.notes || null;

    let error;
    if (existing.data) {
      ({ error } = await sb.from("service_records").update(patch).eq("id", existing.data.id));
    } else {
      if (data.preparedQuantity === undefined)
        return { ok: false, error: "Record the prepared quantity first." };
      // Expected attendance is planning context; copy it from the saved forecast if there is one.
      const fc = await sb.from("demand_forecasts").select("expected_attendance")
        .eq("organization_id", orgId).eq("service_date", data.serviceDate)
        .eq("meal_period", data.meal).maybeSingle();
      ({ error } = await sb.from("service_records").insert({
        ...patch,
        organization_id: orgId,
        service_date: data.serviceDate,
        meal_period: data.meal,
        menu_name: data.menuName,
        expected_attendance: fc.data?.expected_attendance ?? null,
      }));
    }
    if (error) {
      if (error.message?.includes("service_date_in_future"))
        return { ok: false, error: "Actuals can't be recorded for a future date." };
      if (error.message?.includes("surplus_batch_in_progress"))
        return { ok: false, error: "This surplus is already past safety review; quantities are locked." };
      console.error("saveServiceActuals failed", error);
      return { ok: false, error: "Unable to save this service." };
    }
    return { ok: true };
  });

const idSchema = z.object({ recordId: z.string().uuid() });

export const sendToSurplusRescue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => idSchema.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { error } = await context.supabase.rpc("send_to_surplus_rescue", { _record: data.recordId });
    if (error) {
      if (error.message?.includes("no_surplus")) return { ok: false, error: "There is no potential surplus to send." };
      if (error.message?.includes("actuals_missing")) return { ok: false, error: "Record prepared and consumed quantities first." };
      if (error.code === "42501") return { ok: false, error: "Unable to access this service." };
      console.error("sendToSurplusRescue failed", error);
      return { ok: false, error: "Unable to send this surplus." };
    }
    return { ok: true };
  });

export const completeService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => idSchema.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const sb = context.supabase;
    const orgId = await resolveKitchen(sb, context.userId);
    if (!orgId) return { ok: false, error: "Only kitchen admins can complete services." };
    const r = await sb.from("service_records")
      .select("id, prepared_quantity, consumed_quantity, actual_attendance")
      .eq("id", data.recordId).eq("organization_id", orgId).maybeSingle();
    if (!r.data) return { ok: false, error: "Unable to access this service." };
    const { prepared_quantity: p, consumed_quantity: c, actual_attendance: a } = r.data;
    if (p === null || c === null || a === null)
      return { ok: false, error: "Record preparation, attendance and consumption first." };
    if (p - c > 0) {
      const b = await sb.from("surplus_batches").select("status").eq("service_record_id", r.data.id).maybeSingle();
      if (!b.data || b.data.status === "withdrawn")
        return { ok: false, error: "Send the potential surplus to Surplus Rescue before completing." };
    }
    const { error } = await sb.from("service_records")
      .update({ service_completed_at: new Date().toISOString() }).eq("id", r.data.id);
    if (error) {
      console.error("completeService failed", error);
      return { ok: false, error: "Unable to complete this service." };
    }
    return { ok: true };
  });

export const listSurplusBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) throw new Error("Surplus Rescue is available to kitchen admins only.");
    const { data, error } = await context.supabase.from("surplus_batches")
      .select("id, service_record_id, service_date, meal_period, menu_name, prepared_quantity, consumed_quantity, potential_surplus, status, created_at")
      .eq("organization_id", orgId).neq("status", "withdrawn")
      .order("service_date", { ascending: false }).limit(100);
    if (error) {
      console.error("listSurplusBatches failed", error);
      throw new Error("Unable to load surplus batches.");
    }
    return data;
  });
