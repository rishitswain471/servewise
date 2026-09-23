import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/servewise/app-shell";
import { RouteError } from "@/components/servewise/route-error";
import { getMyWorkspace } from "@/lib/org.functions";

export const Route = createFileRoute("/_authenticated/_ngo")({
  beforeLoad: async () => {
    const workspace = await getMyWorkspace();
    const active = workspace.memberships[0];
    if (!active) throw redirect({ to: "/onboarding" });
    // Organization type comes from the verified backend record, never from the URL.
    if (active.organizationType !== "ngo") throw redirect({ to: "/dashboard" });
    return { workspace, activeMembership: active };
  },
  errorComponent: RouteError,
  component: NgoLayout,
});

function NgoLayout() {
  const { workspace, activeMembership } = Route.useRouteContext();
  return (
    <AppShell
      email={workspace.email}
      organizationName={activeMembership.organizationName}
      role={activeMembership.role}
      variant="ngo"
    >
      <Outlet />
    </AppShell>
  );
}
