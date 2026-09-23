import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/menu")({
  head: () =>
    serveWiseHead(
      "Menu & Consumption",
      "Organize menus, consumption records, and historical meal patterns in ServeWise.",
    ),
  component: MenuPage,
});

function MenuPage() {
  return <ProductPage config={serveWisePages.menu} />;
}
