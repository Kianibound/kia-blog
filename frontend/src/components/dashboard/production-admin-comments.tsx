import Link from "next/link";
import { redirect } from "next/navigation";
import { CommentOutOfRange, CommentPagination } from "@/components/comments/comment-pagination";
import { ProductionAdminCommentList } from "@/components/dashboard/production-admin-comment-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { commentsMessages as copy } from "@/i18n/messages/comments.fa";
import type { PublicAccount } from "@/lib/auth/current-user";
import { loadAdminComments } from "@/lib/dashboard/comments";

const controlClass =
  "inline-flex min-h-12 items-center justify-center rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

const BASE = "/dashboard/comments";

function pageHref(page: number) {
  return page === 1 ? BASE : `${BASE}?page=${page}`;
}

export function ProductionAdminCommentsLoading() {
  return (
    <section className="min-h-64 space-y-4" aria-busy="true">
      <p role="status">{copy.admin.title}…</p>
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="space-y-4 p-6">
          <Skeleton className="h-6 w-1/3 motion-reduce:animate-none" />
          <Skeleton className="h-16 w-full motion-reduce:animate-none" />
        </Card>
      ))}
    </section>
  );
}

export async function ProductionAdminComments({
  account,
  page,
}: {
  account: PublicAccount;
  page: number;
}) {
  if (account.user.role !== "ADMIN")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.admin.denied}</p>
      </Card>
    );

  const result = await loadAdminComments(page);
  if (result.status === "unauthenticated")
    redirect(`/session/clear?next=${encodeURIComponent(pageHref(page))}`);
  if (result.status === "forbidden")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.admin.denied}</p>
      </Card>
    );
  if (result.status === "unavailable")
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{copy.admin.unavailable}</p>
        <Link href={pageHref(page)} className={controlClass}>
          {copy.retry}
        </Link>
      </Card>
    );

  const { data, meta } = result.page;
  if (meta.total === 0)
    return (
      <Card className="min-h-64 p-6">
        <p role="status">{copy.admin.empty}</p>
      </Card>
    );
  if (data.length === 0) return <CommentOutOfRange href={BASE} />;

  return (
    <section className="space-y-6" aria-label={copy.admin.title}>
      <div className="space-y-2">
        <h2 className="text-xl leading-tight font-semibold">{copy.admin.title}</h2>
        <p>{copy.admin.description}</p>
      </div>
      <ProductionAdminCommentList
        key={`${page}:${data.map((item) => `${item.id}:${item.version}:${item.status}`).join("|")}`}
        comments={data}
        csrfToken={account.csrfToken}
      />
      <CommentPagination meta={meta} label={copy.admin.paginationLabel} pageHref={pageHref} />
    </section>
  );
}
