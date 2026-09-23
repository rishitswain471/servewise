import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    serveWiseHead(
      "Today’s Kitchen",
      "ServeWise command-center foundation for kitchen demand, preparation, service status, surplus rescue, safety, redistribution, and impact.",
    ),
  component: DashboardPage,
});

function DashboardPage() {
  return <FoundationPage config={foundationPages.dashboard} />;
}
