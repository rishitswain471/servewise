import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const mealPeriods = ["breakfast", "lunch", "dinner"] as const;
export type MealPeriod = (typeof mealPeriods)[number];

const count = z
  .number({ message: "Enter a whole number." })
  .int("Enter a whole number.")
  .min(0, "Cannot be negative.")
  .max(1_000_000, "Value is too large.")
  .nullable();

// Same rules as the Excel import (see import-rules.ts): these three are required.
const required = z
  .number({ message: "This field is required." })
  .int("Enter a whole number.")
  .min(0, "Cannot be negative.")
  .max(1_000_000, "Value is too large.");

export const recordInputSchema = z.object({
  serviceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Choose a valid date."),
  mealPeriod: z.enum(mealPeriods, { message: "Choose a meal period." }),
  menuName: z.string().trim().min(1, "Menu is required.").max(200, "Keep the menu under 200 characters."),
  expectedAttendance: required,
  actualAttendance: count,
  preparedQuantity: required,
  consumedQuantity: required,
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters.").nullable(),
});
export type RecordInput = z.infer<typeof recordInputSchema>;

export type ServiceRecord = Omit<RecordInput, "expectedAttendance" | "preparedQuantity" | "consumedQuantity"> & {
  expectedAttendance: number | null;
  preparedQuantity: number | null;
  consumedQuantity: number | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  importBatchId: string | null;
};

const COLUMNS =
  "id, service_date, meal_period, menu_name, expected_attendance, actual_attendance, prepared_quantity, consumed_quantity, notes, created_at, updated_at, import_batch_id";

type Row = {
  id: string;
  service_date: string;
  meal_period: MealPeriod;
  menu_name: string;
  expected_attendance: number | null;
  actual_attendance: number | null;
  prepared_quantity: number | null;
  consumed_quantity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  import_batch_id: string | null;
};

const toRecord = (r: Row): ServiceRecord => ({
  id: r.id,
  serviceDate: r.service_date,
  mealPeriod: r.meal_period,
  menuName: r.menu_name,
  expectedAttendance: r.expected_attendance,
  actualAttendance: r.actual_attendance,
  preparedQuantity: r.prepared_quantity,
  consumedQuantity: r.consumed_quantity,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  importBatchId: r.import_batch_id,
});

const toRow = (d: RecordInput) => ({
  service_date: d.serviceDate,
  meal_period: d.mealPeriod,
  menu_name: d.menuName,
  expected_attendance: d.expectedAttendance,
  actual_attendance: d.actualAttendance,
  prepared_quantity: d.preparedQuantity,
  consumed_quantity: d.consumedQuantity,
  notes: d.notes || null,
});

type Fail = { ok: false; error: string };
const fail = (error: string): Fail => ({ ok: false, error });

function mapDbError(error: { code?: string; message?: string }, fallback: string): Fail {
  if (error.code === "23505") return fail("A record for this date and meal already exists.");
  if (error.message?.includes("service_date_in_future"))
    return fail("Service date can't be in the future.");
  if (error.code === "23514" || error.code === "22P02") return fail("Please check the values entered.");
  if (error.code === "42501") return fail("Unable to access this record.");
  console.error(fallback, error);
  return fail(fallback);
}

// The owning organization is resolved on the server from the verified session —
// never taken from the request. RLS re-checks kitchen admin access on every query.
async function resolveKitchen(
  supabase: typeof import("@/integrations/supabase/client").supabase,
  userId: string,
) {
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

const filterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meal: z.enum(mealPeriods).optional(),
  menu: z.string().trim().max(100).optional(),
  page: z.number().int().min(0).max(10_000).default(0),
});
export type RecordFilters = z.input<typeof filterSchema>;
const PAGE_SIZE = 25;

export const listServiceRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => filterSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) throw new Error("Unable to load operational data.");
    let q = context.supabase
      .from("service_records")
      .select(COLUMNS, { count: "exact" })
      .eq("organization_id", orgId)
      .order("service_date", { ascending: false })
      .order("meal_period", { ascending: true })
      .range(data.page * PAGE_SIZE, data.page * PAGE_SIZE + PAGE_SIZE - 1);
    if (data.from) q = q.gte("service_date", data.from);
    if (data.to) q = q.lte("service_date", data.to);
    if (data.meal) q = q.eq("meal_period", data.meal);
    if (data.menu) q = q.ilike("menu_name", `%${data.menu.replace(/[%_\\]/g, "\\$&")}%`);
    const { data: rows, error, count: total } = await q;
    if (error) {
      console.error("listServiceRecords failed", error);
      throw new Error("Unable to load operational data.");
    }
    return {
      records: (rows as Row[]).map(toRecord),
      total: total ?? 0,
      page: data.page,
      pageSize: PAGE_SIZE,
    };
  });

export const getRecordSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) throw new Error("Unable to load operational data.");
    const base = () => context.supabase.from("service_records").select(COLUMNS, { count: "exact" }).eq("organization_id", orgId);
    const [recent, oldest] = await Promise.all([
      base().order("service_date", { ascending: false }).order("updated_at", { ascending: false }).limit(5),
      base().order("service_date", { ascending: true }).limit(1),
    ]);
    if (recent.error || oldest.error) {
      console.error("getRecordSummary failed", recent.error ?? oldest.error);
      throw new Error("Unable to load operational data.");
    }
    const recentRows = (recent.data as Row[]).map(toRecord);
    return {
      total: recent.count ?? 0,
      recent: recentRows,
      firstDate: (oldest.data as Row[])[0]?.service_date ?? null,
      lastDate: recentRows[0]?.serviceDate ?? null,
    };
  });

export const createServiceRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => recordInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) return fail("Unable to access this record.");
    const { data: row, error } = await context.supabase
      .from("service_records")
      .insert({ ...toRow(data), organization_id: orgId })
      .select(COLUMNS)
      .single();
    if (error) return mapDbError(error, "Unable to save this record.");
    return { ok: true as const, record: toRecord(row as Row) };
  });

export const updateServiceRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), values: recordInputSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // RLS limits the update to rows the user's kitchen owns; others match zero rows.
    const { data: row, error } = await context.supabase
      .from("service_records")
      .update(toRow(data.values))
      .eq("id", data.id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) return mapDbError(error, "Unable to save this record.");
    if (!row) return fail("Unable to access this record.");
    return { ok: true as const, record: toRecord(row as Row) };
  });

export const deleteServiceRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("service_records")
      .delete()
      .eq("id", data.id)
      .select("id");
    if (error) return mapDbError(error, "Unable to delete this record.");
    if (!rows?.length) return fail("Unable to access this record.");
    return { ok: true as const };
  });
