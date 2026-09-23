import { createFileRoute, redirect } from "@tanstack/react-router";

import { serveWiseHead } from "@/lib/servewise-pages";

export const Route = createFileRoute("/")({
  head: () =>
    serveWiseHead(
      "ServeWise App Foundation",
      "ServeWise opens into the operational dashboard for institutional food-service demand and surplus management.",
    ),
  loader: () => {
    throw redirect({ to: "/dashboard" });
  },
});
