import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";

import { NgoOfferQueue } from "@/components/servewise/ngo-offers";
import { NgoPage } from "@/components/servewise/ngo-page";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_ngo/ngo/pickups")({
  head: () =>
    serveWiseHead("Pickups", "Scheduled pickups of accepted surplus and confirmed receipts."),
  component: PickupsPage,
});

function PickupsPage() {
  return (
    <NgoPage
      eyebrow="Receive"
      title="Pickups"
      subtitle="Scheduled pickups for accepted offers and confirmed receipts."
    >
      <NgoOfferQueue
        statuses={["accepted", "pickup_scheduled", "picked_up", "completed"]}
        icon={Truck}
        emptyTitle="No pickups scheduled."
        emptyDescription="Accepted offers will appear here with their pickup window and location."
      />
    </NgoPage>
  );
}
