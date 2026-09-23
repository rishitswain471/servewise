import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/components/servewise/page";
import { OperationalDataSummary } from "@/components/servewise/records-summary";
import { serveWisePages, serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_org/dashboard")({
  head: () =>
    serveWiseHead(
      "Today’s Kitchen",
      "A calm command center for today’s kitchen planning, preparation, service, surplus rescue, and impact.",
    ),
  component: DashboardPage,
});

// Only the page header comes from static config; every operational number below is read
// from stored service records.
const { table: _t, metrics: _m, sections: _s, ...config } = serveWisePages.dashboard;

function DashboardPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProductPage config={config} />
      <OperationalDataSummary />
    </div>
  );
}
