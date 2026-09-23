import { createFileRoute } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

import { NgoEmpty, NgoPage } from "@/components/servewise/ngo-page";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_ngo/ngo/impact")({
  head: () =>
    serveWiseHead("Recipient Impact", "Food received and redistributed by your organization."),
  component: NgoImpactPage,
});

function NgoImpactPage() {
  return (
    <NgoPage
      eyebrow="Impact"
      title="Impact"
      subtitle="Food received and redistributed by your organization."
    >
      <NgoEmpty
        icon={Leaf}
        title="No food received yet."
        description="Impact is recorded from confirmed receipts."
      />
    </NgoPage>
  );
}
