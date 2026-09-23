import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/demand")({
  head: () =>
    serveWiseHead(
      "Demand Lab",
      "ServeWise Demand Lab foundation for future attendance, calendar, weather, and consumption forecasting workflows.",
    ),
  component: DemandPage,
});

function DemandPage() {
  return <ProductPage config={serveWisePages.demand} />;
}
