import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";

import { NgoCounters, NgoOfferQueue, useNgoOverview } from "@/components/servewise/ngo-offers";
import { NgoPage, RecipientFlow } from "@/components/servewise/ngo-page";
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
  const q = useNgoOverview();
  return (
    <NgoPage
      eyebrow="Today"
      title={activeMembership.organizationName}
      subtitle="Review surplus food offered by kitchens, arrange pickups and track what you receive."
    >
      {q.data ? <NgoCounters offers={q.data.offers} /> : null}
      {q.data && !q.data.profile ? (
        <p className="rounded-md border border-warning/40 bg-warning/15 p-3 text-sm text-warning-foreground">
          Kitchens can't find you yet. Publish your recipient profile in Settings to start receiving offers.
        </p>
      ) : null}
      <RecipientFlow />
      <NgoOfferQueue
        statuses={["sent", "accepted", "pickup_scheduled", "picked_up"]}
        icon={HeartHandshake}
        emptyTitle="No surplus offers yet."
        emptyDescription="Offers from kitchens will appear here when they share safe surplus with your organization."
      />
    </NgoPage>
  );
}
