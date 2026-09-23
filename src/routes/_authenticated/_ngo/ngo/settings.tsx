import { createFileRoute } from "@tanstack/react-router";

import { NgoPage } from "@/components/servewise/ngo-page";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_ngo/ngo/settings")({
  head: () => serveWiseHead("Recipient Settings", "Organization and account details."),
  component: NgoSettingsPage,
});

function NgoSettingsPage() {
  const { workspace } = Route.useRouteContext();
  const activeMembership = workspace.memberships[0]!;
  const rows: [string, string][] = [
    ["Organization", activeMembership.organizationName],
    ["Organization type", "NGO / Recipient Organization"],
    ["Account email", workspace.email ?? "—"],
    ["Access", activeMembership.role === "admin" ? "Admin" : "Member"],
  ];
  return (
    <NgoPage eyebrow="System" title="Settings" subtitle="Organization and account details.">
      <section className="rounded-lg border bg-card">
        <dl className="divide-y">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="truncate text-sm font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </NgoPage>
  );
}
