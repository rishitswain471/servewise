import { createFileRoute } from "@tanstack/react-router";

import { FoundationPage } from "@/components/servewise/page";
import { foundationPages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/menu")({
  head: () =>
    serveWiseHead(
      "Menu & Consumption",
      "ServeWise kitchen-records foundation for menus, portions, preparation, and historical consumption.",
    ),
  component: MenuPage,
});

function MenuPage() {
  return <FoundationPage config={foundationPages.menu} />;
}
