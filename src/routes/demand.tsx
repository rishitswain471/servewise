import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/demand")({
  head: () =>
    serveWiseHead(
      "Demand Lab",
      "ServeWise Demand Lab foundation for future attendance, calendar, weather, and consumption forecasting workflows.",
    ),
  component: DemandPage,
});

function DemandPage() {
  return <FoundationPage config={foundationPages.demand} />;
}
