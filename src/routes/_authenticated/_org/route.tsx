import { RouteError } from "@/components/servewise/route-error";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/servewise/app-shell";
import { getMyWorkspace } from "@/lib/org.functions";

export const Route = createFileRoute("/_authenticated/_org")({
  beforeLoad: async () => {
    const workspace = await getMyWorkspace();
    const active = workspace.memberships[0];
    if (!active) throw redirect({ to: "/onboarding" });
    // Organization type comes from the verified backend record, never from the URL.
    if (active.organizationType !== "kitchen") throw redirect({ to: "/ngo" });
    return { workspace, activeMembership: active };
  },
  errorComponent: RouteError,
  component: OrgLayout,
});

function OrgLayout() {
  const { workspace, activeMembership } = Route.useRouteContext();
  return (
    <AppShell
      email={workspace.email}
      organizationName={activeMembership.organizationName}
      role={activeMembership.role}
      variant="kitchen"
    >
      <Outlet />
    </AppShell>
  );
}
