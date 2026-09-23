import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const orgNameSchema = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters.")
  .max(120, "Organization name must be 120 characters or fewer.");

const roleSchema = z.enum(["admin", "member"]);

export type Workspace = {
  userId: string;
  email: string | null;
  memberships: { organizationId: string; organizationName: string; role: "admin" | "member" }[];
};

// Returns the signed-in user's memberships. Identity comes only from the verified bearer token.
export const getMyWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Workspace> => {
    const { supabase, userId, claims } = context;
    const { data, error } = await supabase
      .from("organization_members")
      .select("role, organization:organizations(id, name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("getMyWorkspace failed", error);
      throw new Error("We couldn't load your organization. Please try again.");
    }
    const memberships = (data ?? []).flatMap((row) => {
      const org = row.organization as { id: string; name: string } | null;
      const role = roleSchema.safeParse(row.role);
      if (!org || !role.success) return [];
      return [{ organizationId: org.id, organizationName: org.name, role: role.data }];
    });
    return {
      userId,
      email: typeof claims?.email === "string" ? claims.email : null,
      memberships,
    };
  });

export const createOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ name: orgNameSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("create_organization", {
      _name: data.name,
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, error: "An organization with this name already exists." };
      }
      if (error.code === "23514") {
        return { ok: false as const, error: "Please enter a valid organization name." };
      }
      console.error("createOrganization failed", error);
      return {
        ok: false as const,
        error: "We couldn't create the organization. Please try again.",
      };
    }
    return { ok: true as const, id: id as string };
  });

// Fetch one organization by ID. Row-level security decides access, so another
// organization's ID returns "not found" rather than its data.
export const getOrganization = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: org, error } = await context.supabase
      .from("organizations")
      .select("id, name, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      console.error("getOrganization failed", error);
      throw new Error("We couldn't load this organization.");
    }
    if (!org) return { ok: false as const, error: "Organization not found or access denied." };
    return { ok: true as const, organization: org };
  });
