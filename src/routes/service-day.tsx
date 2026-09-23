import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/service-day")({
  head: () => serveWiseHead("Service Day", "ServeWise service-day workflow foundation for future prepared, served, and actual consumption tracking."),
  component: ServiceDayPage,
});

function ServiceDayPage() {
  return <FoundationPage config={foundationPages.serviceDay} />;
}
