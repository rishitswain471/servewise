import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/service-day")({
  head: () =>
    serveWiseHead(
      "Service Day",
      "Coordinate preparation, serving, actual consumption, and surplus review for today’s service.",
    ),
  component: ServiceDayPage,
});

function ServiceDayPage() {
  return <ProductPage config={serveWisePages.serviceDay} />;
}
