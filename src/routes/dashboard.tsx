import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/dashboard")({
  head: () => serveWiseHead("Dashboard", "ServeWise dashboard foundation for daily food-service operations, demand, service, surplus, safety, and impact."),
  component: DashboardPage,
});

function DashboardPage() {
  return <FoundationPage config={foundationPages.dashboard} />;
}
