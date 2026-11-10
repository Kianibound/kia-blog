import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountEntry } from "@/components/public/account-entry";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardUnavailable } from "@/components/dashboard/dashboard-states";
import { Card } from "@/components/ui/card";
import { dashboardMessages as copy } from "@/i18n/messages/dashboard.fa";
import { lookupPublicAccount } from "@/lib/auth/current-user";
import {
  canAccessDashboard,
  dashboardDestinations,
  dashboardDestination,
  dashboardSectionMeta,
  toDashboardIdentity,
} from "@/lib/dashboard/access";

export const metadata = { title: copy.title };
// Identity and role are request-scoped; never cache protected dashboard HTML.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section = [] } = await params;
  const lookup = await lookupPublicAccount();
  if (lookup.status === "unauthenticated")
    redirect(
      `/session/clear?next=${encodeURIComponent(dashboardDestination(section))}`,
    );
  if (lookup.status === "unavailable")
    return (
      <DashboardShell
        identity={null}
        destinations={[]}
        title={copy.title}
        description={copy.unavailable}
      >
        <DashboardUnavailable retryHref={dashboardDestination(section)} />
      </DashboardShell>
    );

  const account = lookup.account;
  if (!canAccessDashboard(account.user.role, section)) notFound();
  const meta = dashboardSectionMeta(account.user.role, section);
  if (!meta) notFound();

  return (
    <DashboardShell
      identity={toDashboardIdentity(account.user)}
      destinations={dashboardDestinations(account.user.role)}
      sidebarActions={<AccountEntry account={account} />}
      title={meta.title}
      description={meta.description}
      actions={
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-control bg-brand px-6 font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {copy.browse}
        </Link>
      }
    >
      <Card className="min-h-64 space-y-4 p-6 sm:p-8">
        <h2 className="text-xl leading-tight font-semibold">{meta.title}</h2>
        <p>{meta.description}</p>
        <p>{copy.placeholder}</p>
      </Card>
    </DashboardShell>
  );
}
