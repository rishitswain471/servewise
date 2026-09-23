import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Illustrative defaults used until a kitchen saves its own values. Not measured or official.
export const DEFAULT_ASSUMPTIONS = { financial: 50, co2e: 0.5, social: 1 };
export type Assumptions = typeof DEFAULT_ASSUMPTIONS & { configured: boolean };

type Sb = Parameters<Parameters<ReturnType<typeof createServerFn>["middleware"]>[0][0] extends never ? never : any>[0];

async function kitchenOrg(sb: any, userId: string): Promise<string> {
  const { data: m } = await sb
    .from("organization_members")
    .select("organization_id, organizations!inner(org_type)")
    .eq("user_id", userId).eq("role", "admin").eq("organizations.org_type", "kitchen")
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!m?.organization_id) throw new Error("Available to kitchen admins only.");
  return m.organization_id;
}

export async function loadAssumptions(sb: any, orgId: string): Promise<Assumptions> {
  const { data, error } = await sb.from("impact_assumptions")
    .select("financial_per_meal, co2e_kg_per_meal, social_per_meal").eq("organization_id", orgId).maybeSingle();
  if (error) throw new Error("Unable to load impact assumptions.");
  if (!data) return { ...DEFAULT_ASSUMPTIONS, configured: false };
  return { financial: Number(data.financial_per_meal), co2e: Number(data.co2e_kg_per_meal), social: Number(data.social_per_meal), configured: true };
}

export const getImpactAssumptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => loadAssumptions(context.supabase, await kitchenOrg(context.supabase, context.userId)));

const schema = z.object({
  financial: z.number().finite().min(0).max(100000),
  co2e: z.number().finite().min(0).max(1000),
  social: z.number().finite().min(0).max(1000),
});

export const saveImpactAssumptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ context, data }) => {
    const orgId = await kitchenOrg(context.supabase, context.userId);
    const { error } = await context.supabase.from("impact_assumptions").upsert({
      organization_id: orgId, financial_per_meal: data.financial, co2e_kg_per_meal: data.co2e,
      social_per_meal: data.social, updated_by: context.userId,
    });
    if (error) { console.error("saveImpactAssumptions failed", error); throw new Error("Unable to save impact assumptions."); }
    return { ok: true };
  });

export { kitchenOrg };
export type { Sb };
