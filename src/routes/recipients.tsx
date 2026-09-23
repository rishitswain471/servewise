import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/recipients")({
  head: () =>
    serveWiseHead(
      "Recipients",
      "Manage recipient organizations, available capacity, and pickup coordination.",
    ),
  component: RecipientsPage,
});

function RecipientsPage() {
  return <ProductPage config={serveWisePages.recipients} />;
}
