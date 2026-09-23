import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/servewise/app-shell";
import { getMyWorkspace } from "@/lib/org.functions";

export const Route = createFileRoute("/_authenticated/_org")({
  beforeLoad: async () => {
    const workspace = await getMyWorkspace();
    const active = workspace.memberships[0];
    if (!active) throw redirect({ to: "/onboarding" });
    return { workspace, activeMembership: active };
  },
  component: OrgLayout,
});

function OrgLayout() {
  const { workspace, activeMembership } = Route.useRouteContext();
  return (
    <AppShell
      email={workspace.email}
      organizationName={activeMembership.organizationName}
      role={activeMembership.role}
    >
      <Outlet />
    </AppShell>
  );
}
