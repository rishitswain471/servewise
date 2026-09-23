import { createFileRoute } from "@tanstack/react-router";

import { ServiceRecordsWorkspace } from "@/components/servewise/service-records";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_org/menu")({
  head: () =>
    serveWiseHead(
      "Menu & Consumption",
      "Record and correct menus, attendance, and prepared and consumed meals for each service.",
    ),
  component: MenuPage,
});

function MenuPage() {
  return <ServiceRecordsWorkspace />;
}
