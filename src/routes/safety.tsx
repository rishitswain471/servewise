import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/safety")({
  head: () =>
    serveWiseHead(
      "Safety Gate",
      "ServeWise safety gate foundation for future deterministic storage time and temperature verification.",
    ),
  component: SafetyPage,
});

function SafetyPage() {
  return <ProductPage config={serveWisePages.safety} />;
}
