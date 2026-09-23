import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";

import { NgoEmpty, NgoPage, RecipientFlow } from "@/components/servewise/ngo-page";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_ngo/ngo/")({
  head: () =>
    serveWiseHead(
      "Recipient Dashboard",
      "Review surplus food offers from partner kitchens, arrange pickups and track food received.",
    ),
  component: NgoDashboard,
});

function NgoDashboard() {
  const activeMembership = Route.useRouteContext().workspace.memberships[0]!;
  return (
    <NgoPage
      eyebrow="Today"
      title={activeMembership.organizationName}
      subtitle="Review surplus food offered by kitchens, arrange pickups and track what you receive."
    >
      <RecipientFlow />
      <NgoEmpty
        icon={HeartHandshake}
        title="No surplus offers yet."
        description="Offers from kitchens will appear here when they share safe surplus with your organization."
      />
    </NgoPage>
  );
}
