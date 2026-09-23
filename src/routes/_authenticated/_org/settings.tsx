import { createFileRoute } from "@tanstack/react-router";

import { ImpactAssumptionsForm } from "@/components/servewise/impact-assumptions-form";
import { OrganizationSettingsForm } from "@/components/servewise/organization-settings-form";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_org/settings")({
  head: () => serveWiseHead("Settings", "Manage your organization and impact assumptions."),
  component: SettingsPage,
});

function SettingsPage() {
  const { workspace } = Route.useRouteContext();
  const m = workspace.memberships[0]!;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase text-primary">System</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Organization details and impact assumptions.
        </p>
      </header>
      <OrganizationSettingsForm organizationId={m.organizationId} name={m.organizationName}
        type={m.organizationType} isAdmin={m.role === "admin"} />
      <ImpactAssumptionsForm />
    </div>
  );
}
