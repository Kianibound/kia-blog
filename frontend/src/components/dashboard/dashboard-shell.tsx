import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardMessages as copy } from "@/i18n/messages/dashboard.fa";
import { fa } from "@/lib/utils";
import { DashboardNavigation } from "./dashboard-navigation";
import type { DashboardDestination, DashboardIdentity } from "./types";

export function DashboardPageHeading({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <h1 id="dashboard-heading" className="text-2xl leading-tight font-bold wrap-anywhere sm:text-3xl">{title}</h1>
        {description && <p className="wrap-anywhere">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-4">{actions}</div>}
    </header>
  );
}

export function DashboardShell({ identity, destinations, title, description, actions, children, pending = false }: {
  identity: DashboardIdentity | null;
  destinations: DashboardDestination[];
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  pending?: boolean;
}) {
  const displayName = identity ? identity.name?.trim() || identity.username : null;
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <a href="#dashboard-content" className="sr-only rounded-control bg-background p-4 font-semibold focus:not-sr-only focus:outline-2 focus:outline-ring">{copy.skipToContent}</a>
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-surface border border-border bg-card p-4 sm:p-6">
        <div role="group" aria-label={copy.identity} aria-busy={pending} className="flex min-h-12 min-w-0 items-center gap-4">
          {pending ? <Skeleton className="size-12 shrink-0 motion-reduce:animate-none" /> : displayName && <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-control bg-secondary text-xl font-semibold">{fa(Array.from(displayName)[0])}</span>}
          <div className="min-w-0 space-y-1">
            {pending ? <><Skeleton className="h-6 w-32 motion-reduce:animate-none" /><Skeleton className="h-5 w-16 motion-reduce:animate-none" /></> : <>
              <p className="leading-6 font-semibold wrap-anywhere">{displayName ? fa(displayName) : copy.identityUnavailable}</p>
              {identity && <p className="text-sm leading-5 text-muted-foreground">{copy.roles[identity.role]}</p>}
            </>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-control px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            {copy.returnToBlog}<ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <div className="grid min-w-0 flex-1 content-start gap-6 lg:grid-cols-4">
        <aside className="self-start rounded-surface border border-border bg-card p-4 lg:sticky lg:top-6">
          <DashboardNavigation destinations={destinations} pending={pending} />
        </aside>
        <main id="dashboard-content" tabIndex={-1} aria-labelledby="dashboard-heading" className="min-h-96 min-w-0 space-y-6 lg:col-span-3">
          <DashboardPageHeading title={title} description={description} actions={actions} />
          {children}
        </main>
      </div>
    </div>
  );
}
