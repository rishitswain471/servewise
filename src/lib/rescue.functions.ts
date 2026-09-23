import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Sb = typeof import("@/integrations/supabase/client").supabase;
type Result = { ok: true } | { ok: false; error: string };

// Organization always comes from the verified session, never the request.
async function resolveOrg(sb: Sb, userId: string, type: "kitchen" | "ngo") {
  const { data } = await sb
    .from("organization_members")
    .select("organization_id, organizations!inner(org_type)")
    .eq("user_id", userId).eq("role", "admin").eq("organizations.org_type", type)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  return data?.organization_id ?? null;
}

const errMap: Record<string, string> = {
  not_authorized: "You don't have access to this item.",
  not_pending: "This batch has already been reviewed.",
  invalid_input: "Check the values entered.",
  not_eligible: "Only safety-approved surplus can be offered.",
  recipient_not_found: "Recipient not found.",
  recipient_incompatible: "This recipient isn't compatible with the offer (availability, food type, capacity or pickup window).",
  quantity_exceeds: "Offered quantity exceeds the remaining available surplus.",
  duplicate_offer: "This recipient already has an active offer for this batch.",
  invalid_window: "Choose a valid pickup window.",
  invalid_transition: "This offer has already moved to another stage. Refresh to see its current status.",
};
function fail(error: { message?: string } | null, fallback: string): Result {
  const key = Object.keys(errMap).find((k) => error?.message?.includes(k));
  if (!key) console.error(fallback, error);
  return { ok: false, error: key ? errMap[key]! : fallback };
}

export type Offer = {
  id: string; surplus_batch_id: string; kitchen_name: string; recipient_name: string; menu_name: string;
  service_date: string; meal_period: "breakfast" | "lunch" | "dinner"; quantity: number; pickup_date: string;
  pickup_from: string; pickup_until: string; handling_info: string; status: string; created_at: string;
  pickup_scheduled_at: string | null; pickup_owner: string | null; pickup_notes: string | null;
  picked_up_at: string | null; received_quantity: number | null; received_at: string | null; completed_at: string | null;
};
const OFFER_COLS = "id, surplus_batch_id, kitchen_name, recipient_name, menu_name, service_date, meal_period, quantity, pickup_date, pickup_from, pickup_until, handling_info, status, created_at, pickup_scheduled_at, pickup_owner, pickup_notes, picked_up_at, received_quantity, received_at, completed_at";

export type Recipient = {
  organization_id: string; display_name: string; service_area: string; accepted_food_types: string[];
  capacity_meals: number; pickup_from: string; pickup_until: string; pickup_contact: string;
  pickup_notes: string | null; accepting_offers: boolean;
};

// ---------- Kitchen ----------
export const getRescueOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const orgId = await resolveOrg(sb, context.userId, "kitchen");
    if (!orgId) throw new Error("Available to kitchen admins only.");
    const [b, v, o, p, r] = await Promise.all([
      sb.from("surplus_batches").select("id, service_record_id, service_date, meal_period, menu_name, prepared_quantity, consumed_quantity, potential_surplus, status, created_at")
        .eq("organization_id", orgId).neq("status", "withdrawn").order("service_date", { ascending: false }).limit(100),
      sb.from("safety_verifications").select("id, surplus_batch_id, holding_minutes, storage_mode, temperature_c, handling_notes, outcome, basis, policy_snapshot, reviewer_email, reviewed_at")
        .eq("organization_id", orgId).order("reviewed_at", { ascending: false }).limit(100),
      sb.from("recipient_offers").select(OFFER_COLS).eq("kitchen_org_id", orgId).order("created_at", { ascending: false }).limit(200),
      sb.from("safety_policies").select("max_holding_minutes, min_hot_holding_c, max_cold_holding_c, updated_at").eq("organization_id", orgId).maybeSingle(),
      sb.from("recipient_profiles").select("organization_id, display_name, service_area, accepted_food_types, capacity_meals, pickup_from, pickup_until, pickup_contact, pickup_notes, accepting_offers").order("display_name"),
    ]);
    const e = b.error ?? v.error ?? o.error ?? p.error ?? r.error;
    if (e) { console.error("getRescueOverview failed", e); throw new Error("Unable to load surplus rescue data."); }
    const offers = (o.data ?? []) as Offer[];
    const batches = (b.data ?? []).map((x) => {
      const used = offers.filter((f) => f.surplus_batch_id === x.id && f.status !== "declined")
        .reduce((s, f) => s + (f.status === "completed" ? f.received_quantity ?? f.quantity : f.quantity), 0);
      const redistributed = offers.filter((f) => f.surplus_batch_id === x.id && f.status === "completed")
        .reduce((s, f) => s + (f.received_quantity ?? 0), 0);
      return { ...x, remaining: Math.max(0, x.potential_surplus - used), redistributed };
    });
    return {
      batches,
      verifications: (v.data ?? []).map((x) => ({ ...x, basis: x.basis as { ok: boolean; text: string }[] })),
      offers,
      policy: p.data ?? null,
      recipients: (r.data ?? []) as Recipient[],
    };
  });

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Choose a valid time.");
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

export const savePolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    maxHoldingMinutes: z.number().int().min(1).max(1440),
    minHotC: z.number().min(0).max(100),
    maxColdC: z.number().min(-30).max(20),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const orgId = await resolveOrg(context.supabase, context.userId, "kitchen");
    if (!orgId) return { ok: false, error: "Only kitchen admins can change the policy." };
    const { error } = await context.supabase.from("safety_policies").upsert({
      organization_id: orgId, max_holding_minutes: data.maxHoldingMinutes,
      min_hot_holding_c: data.minHotC, max_cold_holding_c: data.maxColdC,
    });
    return error ? fail(error, "Unable to save the policy.") : { ok: true };
  });

export const recordSafetyCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    batchId: z.string().uuid(),
    holdingMinutes: z.number().int().min(0).max(10080),
    storageMode: z.enum(["hot", "cold"]),
    temperatureC: z.number().min(-50).max(150),
    notes: z.string().max(1000),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    // The eligibility decision is made by the database rule, not by this request.
    const { error } = await context.supabase.rpc("record_safety_check", {
      _batch: data.batchId, _holding_minutes: data.holdingMinutes, _storage_mode: data.storageMode,
      _temperature: data.temperatureC, _notes: data.notes,
    });
    return error ? fail(error, "Unable to record the safety check.") : { ok: true };
  });

export const createOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    batchId: z.string().uuid(), recipientId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100000), pickupDate: day, from: time, until: time,
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { error } = await context.supabase.rpc("create_recipient_offer", {
      _batch: data.batchId, _recipient: data.recipientId, _quantity: data.quantity,
      _pickup_date: data.pickupDate, _from: data.from, _until: data.until,
    });
    return error ? fail(error, "Unable to create the offer.") : { ok: true };
  });

// ---------- Shared offer transitions (authorization enforced in the database) ----------
export const advanceOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    offerId: z.string().uuid(),
    action: z.enum(["accept", "decline", "schedule", "picked_up", "receive"]),
    when: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/).optional(),
    owner: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(500).optional(),
    received: z.number().int().min(0).max(100000).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { error } = await context.supabase.rpc("advance_recipient_offer", {
      _offer: data.offerId, _action: data.action,
      ...(data.when ? { _when: data.when } : {}), ...(data.owner ? { _owner: data.owner } : {}),
      ...(data.notes ? { _notes: data.notes } : {}), ...(data.received !== undefined ? { _received: data.received } : {}),
    });
    return error ? fail(error, "Unable to update the offer.") : { ok: true };
  });

// ---------- NGO ----------
export const getNgoOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const orgId = await resolveOrg(sb, context.userId, "ngo");
    if (!orgId) throw new Error("Available to NGO admins only.");
    const [o, p] = await Promise.all([
      sb.from("recipient_offers").select(OFFER_COLS).eq("recipient_org_id", orgId).order("created_at", { ascending: false }).limit(200),
      sb.from("recipient_profiles").select("organization_id, display_name, service_area, accepted_food_types, capacity_meals, pickup_from, pickup_until, pickup_contact, pickup_notes, accepting_offers").eq("organization_id", orgId).maybeSingle(),
    ]);
    if (o.error || p.error) { console.error("getNgoOverview failed", o.error ?? p.error); throw new Error("Unable to load offers."); }
    return { offers: (o.data ?? []) as Offer[], profile: (p.data ?? null) as Recipient | null };
  });

export const saveRecipientProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    serviceArea: z.string().trim().min(1, "Service area is required.").max(200),
    capacity: z.number().int().min(0).max(100000),
    from: time, until: time,
    contact: z.string().trim().min(1, "Pickup contact is required.").max(200),
    notes: z.string().trim().max(500).optional(),
    accepting: z.boolean(),
    foodTypes: z.array(z.enum(["prepared_meals", "packaged_food", "produce"])).min(1),
  }).refine((d) => d.until > d.from, "Pickup window end must be after start.").parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const orgId = await resolveOrg(context.supabase, context.userId, "ngo");
    if (!orgId) return { ok: false, error: "Only NGO admins can edit the recipient profile." };
    const { error } = await context.supabase.rpc("upsert_recipient_profile", {
      _org: orgId, _area: data.serviceArea, _food_types: data.foodTypes, _capacity: data.capacity,
      _from: data.from, _until: data.until, _contact: data.contact, _notes: data.notes ?? "", _accepting: data.accepting,
    });
    return error ? fail(error, "Unable to save the profile.") : { ok: true };
  });
