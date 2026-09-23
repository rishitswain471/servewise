import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Read-only. Every query is scoped to the kitchen resolved from the session;
// RLS (is_kitchen_admin) is the enforcing boundary.
export const getImpactData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: m } = await sb
      .from("organization_members")
      .select("organization_id, organizations!inner(org_type)")
      .eq("user_id", context.userId).eq("role", "admin").eq("organizations.org_type", "kitchen")
      .order("created_at", { ascending: true }).limit(1).maybeSingle();
    const orgId = m?.organization_id;
    if (!orgId) throw new Error("Available to kitchen admins only.");
    const [s, b, v, o, f] = await Promise.all([
      sb.from("service_records").select("id, service_date, meal_period, prepared_quantity, consumed_quantity")
        .eq("organization_id", orgId).not("service_completed_at", "is", null).limit(2000),
      sb.from("surplus_batches").select("id, service_record_id, service_date, meal_period, potential_surplus, status")
        .eq("organization_id", orgId).neq("status", "withdrawn").limit(2000),
      sb.from("safety_verifications").select("surplus_batch_id, outcome").eq("organization_id", orgId).limit(2000),
      sb.from("recipient_offers").select("id, surplus_batch_id, recipient_org_id, recipient_name, service_date, meal_period, quantity, status, received_quantity")
        .eq("kitchen_org_id", orgId).limit(5000),
      sb.from("demand_forecasts").select("service_date, meal_period, forecast_demand, recommended_preparation")
        .eq("organization_id", orgId).limit(2000),
    ]);
    const e = s.error ?? b.error ?? v.error ?? o.error ?? f.error;
    if (e) { console.error("getImpactData failed", e); throw new Error("Unable to load impact data."); }
    return {
      services: s.data ?? [], batches: b.data ?? [], verifications: v.data ?? [],
      offers: o.data ?? [], forecasts: f.data ?? [],
    };
  });

export type ImpactData = Awaited<ReturnType<typeof getImpactData>>;
