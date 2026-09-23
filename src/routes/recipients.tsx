import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/recipients")({
  head: () =>
    serveWiseHead(
      "Recipients",
      "ServeWise recipient network foundation for availability, capacity, pickup windows, and redistribution fit.",
    ),
  component: RecipientsPage,
});

function RecipientsPage() {
  return <ProductPage config={serveWisePages.recipients} />;
}
