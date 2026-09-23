import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { MAX_IMPORT_ROWS, importFields, validateRows, type Cell } from "@/lib/import-rules";

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

// ---------------------------------------------------------------------------
// Excel import. The browser only parses the workbook into raw cells; every rule is
// re-applied here, and again inside one database transaction on commit.
// ---------------------------------------------------------------------------

const cellSchema = z.union([z.string().max(2000), z.number().finite(), z.null()]);
const importPayload = z.object({
  fileName: z.string().trim().min(1).max(255),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  replaceBatchId: z.string().uuid().nullable(),
  rows: z
    .array(
      z.object({
        row: z.number().int().min(2).max(1_048_576),
        cells: z.object(Object.fromEntries(importFields.map((f) => [f, cellSchema.optional().transform((v) => v ?? null)])) as unknown as Record<(typeof importFields)[number], z.ZodType<Cell, z.ZodTypeDef, Cell | undefined>>).strict(),
      }),
    )
    .min(1)
    .max(MAX_IMPORT_ROWS),
});

// The client's local date is accepted only within a day of the server clock.
function trustedToday(clientToday: string) {
  const now = Date.now();
  const d = (o: number) => new Date(now + o * 86_400_000).toISOString().slice(0, 10);
  return clientToday >= d(-1) && clientToday <= d(1) ? clientToday : d(0);
}

async function existingKeys(
  supabase: typeof import("@/integrations/supabase/client").supabase,
  orgId: string,
  rows: { cells: Partial<Record<string, unknown>> }[],
  replaceBatchId: string | null,
) {
  const dates = rows
    .map((r) => String(r.cells["service_date"] ?? "").trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
    .sort();
  const keys = new Set<string>();
  if (!dates.length) return keys;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("service_records")
      .select("service_date, meal_period, import_batch_id")
      .eq("organization_id", orgId)
      .gte("service_date", dates[0])
      .lte("service_date", dates[dates.length - 1])
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    for (const r of data) if (!replaceBatchId || r.import_batch_id !== replaceBatchId) keys.add(`${r.service_date}|${r.meal_period}`);
    if (data.length < 1000) return keys;
  }
}

async function runValidation(
  supabase: typeof import("@/integrations/supabase/client").supabase,
  userId: string,
  data: z.infer<typeof importPayload>,
) {
  const orgId = await resolveKitchen(supabase, userId);
  if (!orgId) return null;
  if (data.replaceBatchId) {
    const { data: b } = await supabase
      .from("import_batches")
      .select("id")
      .eq("id", data.replaceBatchId)
      .eq("organization_id", orgId)
      .eq("status", "active")
      .maybeSingle();
    if (!b) return { orgId, missingBatch: true as const };
  }
  const existing = await existingKeys(supabase, orgId, data.rows, data.replaceBatchId);
  const rows = validateRows(data.rows, existing, trustedToday(data.today));
  const summary = {
    total: rows.length,
    valid: rows.filter((r) => r.status === "valid").length,
    warnings: rows.filter((r) => r.status === "warning").length,
    errors: rows.filter((r) => r.status === "error").length,
  };
  return { orgId, rows, summary, missingBatch: false as const };
}

export const validateImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => importPayload.parse(input))
  .handler(async ({ data, context }) => {
    try {
      const res = await runValidation(context.supabase, context.userId, data);
      if (!res) return fail("Unable to access this kitchen's records.");
      if (res.missingBatch) return fail("The import you're replacing no longer exists.");
      return { ok: true as const, rows: res.rows, summary: res.summary };
    } catch (e) {
      console.error("validateImport failed", e);
      return fail("Unable to check this workbook. Please try again.");
    }
  });

export const commitImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    importPayload.extend({ acceptWarnings: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      const res = await runValidation(context.supabase, context.userId, data);
      if (!res) return fail("Unable to access this kitchen's records.");
      if (res.missingBatch) return fail("The import you're replacing no longer exists.");
      if (res.summary.errors) return fail("Fix all errors before importing.");
      if (res.summary.warnings && !data.acceptWarnings) return fail("Confirm the warnings before importing.");
      const { data: batchId, error } = await context.supabase.rpc("import_service_records", {
        _org: res.orgId,
        _file_name: data.fileName,
        _rows: res.rows.map((r) => r.clean!) as unknown as Json,
        ...(data.replaceBatchId ? { _replace: data.replaceBatchId } : {}),
      });
      if (error) {
        if (error.code === "23505")
          return fail("Another record for one of these dates and meals was saved meanwhile. Nothing was imported — check again.");
        return mapDbError(error, "The import failed. Nothing was saved.");
      }
      return { ok: true as const, batchId: batchId as string, count: res.rows.length };
    } catch (e) {
      console.error("commitImport failed", e);
      return fail("The import failed. Nothing was saved.");
    }
  });

export type ImportBatch = { id: string; fileName: string; importedAt: string; importedCount: number; currentCount: number };

export const listImports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ImportBatch[]> => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) throw new Error("Unable to load imports.");
    const { data, error } = await context.supabase
      .from("import_batches")
      .select("id, file_name, imported_at, record_count")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .order("imported_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("listImports failed", error);
      throw new Error("Unable to load imports.");
    }
    return Promise.all(
      data.map(async (b) => {
        const { count } = await context.supabase
          .from("service_records")
          .select("id", { count: "exact", head: true })
          .eq("import_batch_id", b.id);
        return { id: b.id, fileName: b.file_name, importedAt: b.imported_at, importedCount: b.record_count, currentCount: count ?? 0 };
      }),
    );
  });

export const removeImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ batchId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const orgId = await resolveKitchen(context.supabase, context.userId);
    if (!orgId) return fail("Unable to access this import.");
    const { data: n, error } = await context.supabase.rpc("remove_import_batch", { _org: orgId, _batch: data.batchId });
    if (error) {
      if (error.code === "P0002") return fail("This import no longer exists.");
      return mapDbError(error, "Unable to remove this import.");
    }
    return { ok: true as const, removed: n as number };
  });
