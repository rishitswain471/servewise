import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/recipients")({
  head: () =>
    serveWiseHead(
      "Recipients",
      "ServeWise recipients foundation for future recipient profiles, availability, and matching workflows.",
    ),
  component: RecipientsPage,
});

function RecipientsPage() {
  return <FoundationPage config={foundationPages.recipients} />;
}
