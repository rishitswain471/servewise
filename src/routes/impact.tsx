import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/impact")({
  head: () =>
    serveWiseHead(
      "Impact",
      "Review verified food, financial, environmental, and community outcomes.",
    ),
  component: ImpactPage,
});

function ImpactPage() {
  return <ProductPage config={serveWisePages.impact} />;
}
