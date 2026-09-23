import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_org/copilot")({
  head: () =>
    serveWiseHead(
      "ServeWise Copilot",
      "Ask questions about verified kitchen results and operational decisions.",
    ),
  component: CopilotPage,
});

function CopilotPage() {
  return <ProductPage config={serveWisePages.copilot} />;
}
