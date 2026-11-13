import Link from "next/link";
import { Card } from "@/components/ui/card";
import { commentsMessages as copy } from "@/i18n/messages/comments.fa";
import type { CommentPageMeta } from "@/lib/comments-contract";
import { fa } from "@/lib/utils";

const controlClass =
  "inline-flex min-h-12 items-center justify-center rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export function CommentPagination({
  meta,
  label,
  pageHref,
}: {
  meta: CommentPageMeta;
  label: string;
  pageHref: (page: number) => string;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-4">
      {meta.page > 1 && (
        <Link href={pageHref(meta.page - 1)} className={controlClass}>
          {copy.pagination.previous}
        </Link>
      )}
      <p>
        {copy.pagination.page} {fa(meta.page)} {copy.pagination.of} {fa(meta.totalPages)}
      </p>
      {meta.page < meta.totalPages && (
        <Link href={pageHref(meta.page + 1)} className={controlClass}>
          {copy.pagination.next}
        </Link>
      )}
    </nav>
  );
}

export function CommentOutOfRange({ href }: { href: string }) {
  return (
    <Card className="min-h-64 space-y-4 p-6">
      <p role="status">{copy.pagination.outOfRange}</p>
      <Link href={href} className={controlClass}>
        {copy.pagination.firstPage}
      </Link>
    </Card>
  );
}
