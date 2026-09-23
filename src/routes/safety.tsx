import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/safety")({
  head: () =>
    serveWiseHead(
      "Safety Gate",
      "ServeWise safety gate foundation for future deterministic storage time and temperature verification.",
    ),
  component: SafetyPage,
});

function SafetyPage() {
  return <FoundationPage config={foundationPages.safety} />;
}
