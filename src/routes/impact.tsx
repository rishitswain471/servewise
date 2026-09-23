import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/impact")({
  head: () =>
    serveWiseHead(
      "Impact",
      "ServeWise impact dashboard foundation for future food, cost, carbon, and social outcome calculations.",
    ),
  component: ImpactPage,
});

function ImpactPage() {
  return <FoundationPage config={foundationPages.impact} />;
}
