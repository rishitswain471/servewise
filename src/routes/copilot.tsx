import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/copilot")({
  head: () => serveWiseHead("ServeWise Copilot", "ServeWise Copilot chat foundation only, with no AI integration or generated responses in C1."),
  component: CopilotPage,
});

function CopilotPage() {
  return <FoundationPage config={foundationPages.copilot} />;
}
