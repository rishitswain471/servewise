import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    serveWiseHead(
      "Today’s Kitchen",
      "A calm command center for today’s kitchen planning, preparation, service, surplus rescue, and impact.",
    ),
  component: DashboardPage,
});

function DashboardPage() {
  return <ProductPage config={serveWisePages.dashboard} />;
}
