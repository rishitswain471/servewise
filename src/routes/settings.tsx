import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/settings")({
  head: () =>
    serveWiseHead(
      "Settings",
      "ServeWise kitchen organization setup foundation for future profile, data, notification, and access configuration.",
    ),
  component: SettingsPage,
});

function SettingsPage() {
  return <ProductPage config={serveWisePages.settings} />;
}
