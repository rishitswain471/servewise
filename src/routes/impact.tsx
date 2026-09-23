import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/impact")({
  head: () =>
    serveWiseHead(
      "Impact",
      "ServeWise food rescue impact foundation for later deterministic food, cost, carbon, and community calculations.",
    ),
  component: ImpactPage,
});

function ImpactPage() {
  return <FoundationPage config={foundationPages.impact} />;
}
