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

// The pre-C3 Today's Kitchen (header, status metrics, demand/service/surplus/impact sections)
// is preserved as-is. Only the former demo "Recent operational activity" table is replaced by
// the real service-record summary below.
const { table: _t, ...config } = serveWisePages.dashboard;

function DashboardPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProductPage config={config} />
      <OperationalDataSummary />
    </div>
  );
}
