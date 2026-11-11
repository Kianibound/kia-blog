import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AccountEntry } from "@/components/public/account-entry";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardUnavailable } from "@/components/dashboard/dashboard-states";
import {
  ProductionPosts,
  ProductionPostsLoading,
} from "@/components/dashboard/production-posts";
import { ArticleFormLoading } from "@/components/dashboard/article-form";
import { ProductionArticleEditor } from "@/components/dashboard/production-article-editor";
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
import { inventoryPage, inventoryStatus } from "@/lib/own-posts-contract";

export const metadata = { title: copy.title };
// Identity and role are request-scoped; never cache protected dashboard HTML.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{
    page?: string | string[];
    status?: string | string[];
  }>;
}) {
  const { section = [] } = await params;
  const query = await searchParams;
  const page = inventoryPage(query.page);
  const lookup = await lookupPublicAccount();  if (lookup.status === "unauthenticated")
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
  const parsedStatus = inventoryStatus(query.status);
  const status = parsedStatus ?? undefined;
  const invalidStatus =
    parsedStatus === null ||
    (account.user.role === "ADMIN" && query.status !== undefined);
  const newArticle =
    section.length === 2 && section[0] === "posts" && section[1] === "new";
  const editId =
    section.length === 3 &&
    section[0] === "posts" &&
    section[2] === "edit"
      ? section[1]
      : undefined;

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
      {newArticle || editId ? (
        <Suspense
          key={editId ?? "new"}
          fallback={<ArticleFormLoading />}
        >
          <ProductionArticleEditor account={account} articleId={editId} />
        </Suspense>
      ) : section.length === 1 && section[0] === "posts" ? (
        <Suspense
          key={`${page}-${status ?? "all"}`}
          fallback={
            <ProductionPostsLoading
              admin={account.user.role === "ADMIN"}
            />
          }
        >
          <ProductionPosts
            account={account}
            page={page}
            status={status}
            invalidStatus={invalidStatus}
          />
        </Suspense>
      ) : (
        <Card className="min-h-64 space-y-4 p-6 sm:p-8">
          <h2 className="text-xl leading-tight font-semibold">{meta.title}</h2>
          <p>{meta.description}</p>
          <p>{copy.placeholder}</p>
        </Card>
      )}
    </DashboardShell>
  );
}
