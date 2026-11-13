import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PostCard } from "./post-card";
import { Card } from "@/components/ui/card";
import { messages } from "@/i18n/messages/fa";
import { pagedHref } from "@/lib/discovery";
import { getPublishedPosts } from "@/lib/posts";
import { fa } from "@/lib/utils";
import type { PostsQuery } from "@/lib/posts-query";

const pageLinkClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export async function DiscoveryFeed({
  query,
  base,
  empty,
}: {
  query: PostsQuery;
  base: string;
  empty: string;
}) {
  let feed;
  try {
    feed = await getPublishedPosts(query);
  } catch {
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{messages.home.feedError}</p>
        <p>{messages.home.feedErrorHelp}</p>
        <Link href={base} className={pageLinkClass}>
          {messages.discovery.retry}
        </Link>
      </Card>
    );
  }

  const { data: posts, meta } = feed;
  const state = { page: meta.page, sort: query.sort, q: query.search };
  const outOfRange = posts.length === 0 && meta.page > meta.totalPages && meta.total > 0;
  if (meta.total === 0)
    return (
      <Card className="min-h-64 p-6">
        <p role="status">{empty}</p>
      </Card>
    );

  return (
    <div className="min-h-64 space-y-6">
      {outOfRange ? (
        <div className="space-y-4">
          <p role="status">{messages.home.pageOutOfRange}</p>
          <Link href={pagedHref(base, { ...state, page: 1 })} className={pageLinkClass}>
            {messages.home.returnToFirstPage}
          </Link>
        </div>
      ) : (
        <ul aria-label={messages.home.feedLabel} className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <li key={post.id} className="min-w-0">
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
      {meta.total > 0 && !outOfRange && (
        <nav aria-label={messages.home.pagination} className="flex flex-wrap items-center justify-center gap-4">
          {meta.page > 1 && (
            <Link href={pagedHref(base, { ...state, page: meta.page - 1 })} className={pageLinkClass}>
              <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
              {messages.home.previousPage}
            </Link>
          )}
          <p>
            {messages.home.page} {fa(String(meta.page))} {messages.home.of}{" "}
            {fa(String(meta.totalPages))}
          </p>
          {meta.page < meta.totalPages && (
            <Link href={pagedHref(base, { ...state, page: meta.page + 1 })} className={pageLinkClass}>
              {messages.home.nextPage}
              <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
