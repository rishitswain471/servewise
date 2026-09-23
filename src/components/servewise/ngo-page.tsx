import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/servewise/page";

export function NgoPage({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </header>
      {children}
    </div>
  );
}

export function NgoEmpty({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 sm:p-6">
      <EmptyState title={title} description={description} icon={icon} />
    </section>
  );
}

const flow = ["Available surplus", "Review offer", "Accept", "Pickup", "Confirm receipt", "Impact"];

export function RecipientFlow() {
  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5" aria-label="How food recovery works">
      <h2 className="text-sm font-semibold text-foreground">How food recovery works</h2>
      <ol className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {flow.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-2 rounded-md border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <span className="min-w-0 truncate">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
