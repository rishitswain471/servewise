import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";

import { NgoOfferQueue } from "@/components/servewise/ngo-offers";
import { NgoPage } from "@/components/servewise/ngo-page";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_ngo/ngo/offers")({
  head: () =>
    serveWiseHead(
      "Available Surplus",
      "Surplus food offers from kitchens, with quantity, safety status and pickup window.",
    ),
  component: OffersPage,
});

function OffersPage() {
  return (
    <NgoPage
      eyebrow="Receive"
      title="Available Surplus"
      subtitle="Offers shared with your organization, with quantity, safety status and pickup window."
    >
      <NgoOfferQueue
        statuses={["sent", "declined"]}
        icon={HeartHandshake}
        emptyTitle="No surplus offers yet."
        emptyDescription="When a kitchen offers safe surplus to your organization, you can review and accept it here."
      />
    </NgoPage>
  );
}
