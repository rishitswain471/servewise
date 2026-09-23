import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ServeWiseMark } from "@/lib/servewise-navigation";

const title = "ServeWise — Plan better. Serve smarter. Rescue surplus.";
const description =
  "ServeWise helps food-service organizations forecast demand, plan preparation, track consumption, and redistribute safe surplus to recipient organizations.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

const flow = [
  ["Plan", "Expected demand from attendance, menu and history."],
  ["Prepare", "Preparation quantities closer to real demand."],
  ["Serve", "Record what was prepared and consumed."],
  ["Rescue", "Check safety and offer surplus to recipients."],
  ["Measure", "Food, cost and carbon impact over time."],
] as const;

function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="border-b bg-surface-raised">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <ServeWiseMark className="h-6 w-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-foreground">ServeWise</span>
              <span className="block text-xs text-muted-foreground">Food-service operations</span>
            </span>
          </div>
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
          <p className="text-xs font-semibold uppercase text-primary">Food-service operations</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Plan better. Serve smarter. Rescue surplus.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            ServeWise helps food-service organizations understand expected demand, plan
            preparation, track actual consumption, identify eligible surplus, connect it with
            recipient organizations, and measure impact.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6" aria-label="Product flow">
          <ol className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-5">
            {flow.map(([step, text], i) => (
              <li key={step} className="bg-card p-5">
                <span className="text-xs font-semibold text-primary">0{i + 1}</span>
                <p className="mt-2 text-base font-semibold text-foreground">{step}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          ServeWise · For kitchens and recipient organizations
        </div>
      </footer>
    </div>
  );
}
