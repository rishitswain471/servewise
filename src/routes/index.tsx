import { createFileRoute, redirect } from "@tanstack/react-router";

import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/")({
  head: () =>
    serveWiseHead(
      "ServeWise Kitchen Operations",
      "ServeWise opens into Today’s Kitchen for institutional food-service demand, preparation, surplus rescue, safety, and impact.",
    ),
  loader: () => {
    throw redirect({ to: "/dashboard" });
  },
});
