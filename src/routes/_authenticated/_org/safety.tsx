import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_org/safety")({
  head: () =>
    serveWiseHead(
      "Safety Gate",
      "Review recorded holding time, temperature, and handling conditions for surplus batches.",
    ),
  component: SafetyPage,
});

function SafetyPage() {
  return <ProductPage config={serveWisePages.safety} />;
}
