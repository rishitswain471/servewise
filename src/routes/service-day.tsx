import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/service-day")({
  head: () =>
    serveWiseHead(
      "Service Day",
      "ServeWise service-day foundation for meal preparation, serving, actual consumption, and surplus review.",
    ),
  component: ServiceDayPage,
});

function ServiceDayPage() {
  return <FoundationPage config={foundationPages.serviceDay} />;
}
