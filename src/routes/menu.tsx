import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/menu")({
  head: () => serveWiseHead("Menu and Consumption", "ServeWise menu and consumption workspace foundation for future institutional kitchen analysis."),
  component: MenuPage,
});

function MenuPage() {
  return <FoundationPage config={foundationPages.menu} />;
}
