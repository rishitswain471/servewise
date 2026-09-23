import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/demand")({
  head: () =>
    serveWiseHead(
      "Demand Lab",
      "Plan meal demand using attendance, menus, calendar context, and historical consumption.",
    ),
  component: DemandPage,
});

function DemandPage() {
  return <ProductPage config={serveWisePages.demand} />;
}
