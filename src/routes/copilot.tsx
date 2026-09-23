import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/copilot")({
  head: () =>
    serveWiseHead(
      "ServeWise Copilot",
      "ServeWise food-service explanation assistant foundation only, with no AI integration or generated responses in C1.",
    ),
  component: CopilotPage,
});

function CopilotPage() {
  return <ProductPage config={serveWisePages.copilot} />;
}
