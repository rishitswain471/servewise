import { RouteError } from "@/components/servewise/route-error";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/servewise/app-shell";
import { getMyWorkspace } from "@/lib/org.functions";

export const Route = createFileRoute("/_authenticated/_org")({
  // Redirects happen in the component: throwing redirect() from this layout's
  // beforeLoad during client navigation leaves the match in a broken state.
  beforeLoad: async () => ({ workspace: await getMyWorkspace() }),
  errorComponent: RouteError,
  component: OrgLayout,
});

function OrgLayout() {
  const { workspace } = Route.useRouteContext();
  const activeMembership = workspace.memberships[0];
  if (!activeMembership) return <Navigate to="/onboarding" replace />;
  // Organization type comes from the verified backend record, never from the URL.
  if (activeMembership.organizationType !== "kitchen") return <Navigate to="/ngo" replace />;
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
