import { useState, type FormEvent } from "react";
import { RouteError } from "@/components/servewise/route-error";
import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createOrganization,
  getMyWorkspace,
  orgNameSchema,
  orgTypeSchema,
} from "@/lib/org.functions";
import { ServeWiseMark } from "@/lib/servewise-navigation";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your organization — ServeWise" },
      { name: "description", content: "Create the organization your kitchens operate under." },
      { property: "og:title", content: "Set up your organization — ServeWise" },
      {
        property: "og:description",
        content: "Create the organization your kitchens operate under.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const workspace = await getMyWorkspace();
    const active = workspace.memberships[0];
    if (active) throw redirect({ to: active.organizationType === "ngo" ? "/ngo" : "/dashboard" });
  },
  errorComponent: RouteError,
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const create = useServerFn(createOrganization);
  const [name, setName] = useState("");
  const [type, setType] = useState<"kitchen" | "ngo" | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = orgNameSchema.safeParse(name);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid name.");
    const parsedType = orgTypeSchema.safeParse(type);
    if (!parsedType.success) return setError("Choose an organization type.");
    setPending(true);
    setError(null);
    try {
      const result = await create({ data: { name: parsed.data, type: parsedType.data } });
      if (!result.ok) return setError(result.error);
      await router.invalidate();
      navigate({ to: result.type === "ngo" ? "/ngo" : "/dashboard", replace: true });
    } catch {
      setError("Network problem. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
          <ServeWiseMark className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Set up your organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name the organization your kitchens operate under. You'll be its admin.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Campus Dining"
            />
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-foreground">Organization type</legend>
            <div className="grid gap-2">
              {(
                [
                  ["kitchen", "Kitchen / Food Service", "Plans meals and manages surplus."],
                  ["ngo", "NGO / Recipient Organization", "Receives redistributed food."],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="org-type"
                    value={value}
                    checked={type === value}
                    onChange={() => setType(value)}
                    className="mt-1 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{label}</span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create organization"}
          </Button>
        </form>
      </div>
    </div>
  );
}
