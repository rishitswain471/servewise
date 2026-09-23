import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_org/settings")({
  head: () => serveWiseHead("Settings", "Manage kitchen, organization, and data preferences."),
  component: SettingsPage,
});

function SettingsPage() {
  return <ProductPage config={serveWisePages.settings} />;
}
