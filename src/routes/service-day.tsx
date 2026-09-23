import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/service-day")({
  head: () =>
    serveWiseHead(
      "Service Day",
      "ServeWise service-day foundation for meal preparation, serving, actual consumption, and surplus review.",
    ),
  component: ServiceDayPage,
});

function ServiceDayPage() {
  return <ProductPage config={serveWisePages.serviceDay} />;
}
