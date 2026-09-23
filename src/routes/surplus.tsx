import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/surplus")({
  head: () =>
    serveWiseHead(
      "Surplus Rescue",
      "Record usable surplus and coordinate verification, recipient offers, and pickup.",
    ),
  component: SurplusPage,
});

function SurplusPage() {
  return <ProductPage config={serveWisePages.surplus} />;
}
