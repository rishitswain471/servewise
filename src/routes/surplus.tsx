import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/surplus")({
  head: () =>
    serveWiseHead(
      "Surplus Rescue",
      "ServeWise surplus rescue foundation for usable surplus capture, recipient offers, and pickup tracking.",
    ),
  component: SurplusPage,
});

function SurplusPage() {
  return <ProductPage config={serveWisePages.surplus} />;
}
