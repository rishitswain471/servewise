import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/impact")({
  head: () =>
    serveWiseHead(
      "Impact",
      "ServeWise food rescue impact foundation for later deterministic food, cost, carbon, and community calculations.",
    ),
  component: ImpactPage,
});

function ImpactPage() {
  return <ProductPage config={serveWisePages.impact} />;
}
