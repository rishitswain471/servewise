import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";

import { NgoEmpty, NgoPage } from "@/components/servewise/ngo-page";
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
      <NgoEmpty
        icon={Truck}
        title="No pickups scheduled."
        description="Accepted offers will appear here with their pickup window and location."
      />
    </NgoPage>
  );
}
