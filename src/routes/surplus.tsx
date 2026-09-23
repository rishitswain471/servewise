import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/surplus")({
  head: () =>
    serveWiseHead(
      "Surplus Rescue",
      "ServeWise surplus rescue foundation for usable surplus capture, recipient offers, and pickup tracking.",
    ),
  component: SurplusPage,
});

function SurplusPage() {
  return <FoundationPage config={foundationPages.surplus} />;
}
