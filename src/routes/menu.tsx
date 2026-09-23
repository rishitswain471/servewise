import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/menu")({
  head: () =>
    serveWiseHead(
      "Menu & Consumption",
      "ServeWise kitchen-records foundation for menus, portions, preparation, and historical consumption.",
    ),
  component: MenuPage,
});

function MenuPage() {
  return <ProductPage config={serveWisePages.menu} />;
}
