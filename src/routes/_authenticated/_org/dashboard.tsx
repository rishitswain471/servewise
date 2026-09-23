import { createFileRoute } from "@tanstack/react-router";

import { OperationalDataSummary } from "@/components/servewise/records-summary";
import { TodaysKitchen } from "@/components/servewise/todays-kitchen";
import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/_authenticated/_org/dashboard")({
  head: () =>
    serveWiseHead(
      "Today’s Kitchen",
      "Today’s planning, preparation, service, surplus rescue, and impact from your kitchen’s records.",
    ),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase text-primary">Today’s Kitchen</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          Kitchen operations at a glance
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Today’s planning, preparation, service, surplus rescue, and impact from your records.
        </p>
      </header>
      <TodaysKitchen />
      <OperationalDataSummary />
    </div>
  );
}
