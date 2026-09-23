import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/settings")({
  head: () =>
    serveWiseHead(
      "Settings",
      "ServeWise kitchen organization setup foundation for future profile, data, notification, and access configuration.",
    ),
  component: SettingsPage,
});

function SettingsPage() {
  return <FoundationPage config={foundationPages.settings} />;
}
