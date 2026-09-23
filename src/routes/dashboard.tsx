import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    serveWiseHead(
      "Today’s Kitchen",
      "ServeWise command-center foundation for kitchen demand, preparation, service status, surplus rescue, safety, redistribution, and impact.",
    ),
  component: DashboardPage,
});

function DashboardPage() {
  return <ProductPage config={serveWisePages.dashboard} />;
}
