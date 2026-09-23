import { createFileRoute } from "@tanstack/react-router";

import { DemandLab } from "@/components/servewise/demand-lab";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_org/demand")({
  head: () =>
    serveWiseHead(
      "Demand Lab",
      "Forecast meal demand and preparation quantities from your kitchen's recorded service history.",
    ),
  component: DemandPage,
});

function DemandPage() {
  return <DemandLab />;
}
