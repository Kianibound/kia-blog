import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PostCard } from "./post-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { messages } from "@/i18n/messages/fa";
import { getPublishedPosts } from "@/lib/posts";
import { fa } from "@/lib/utils";

export async function PublishedFeed({ page }: { page: number }) {
  let feed;
  try {
    feed = await getPublishedPosts(page);
  } catch {
    // All read failures share safe copy; upstream details never enter the page.
    return (
      <Card role="alert" className="min-h-64 space-y-4 p-6">
        <p>{messages.home.feedError}</p>
        <p>{messages.home.feedErrorHelp}</p>
        {/* A native GET bypasses the client router cache for a fresh server read. */}
        <form action="/" method="get">
          <input type="hidden" name="page" value={page} />
          <Button type="submit" size="lg" className="motion-reduce:transition-none">{messages.home.retry}</Button>
        </form>
      </Card>
    );
  }

  const { data: posts, meta } = feed;
  const outOfRange = posts.length === 0 && meta.page > meta.totalPages && meta.total > 0;
  const pageLinkClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

  return (
    <div className="min-h-64 space-y-6">
      <ul aria-label={messages.home.feedLabel} className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id} className="min-w-0"><PostCard post={post} /></li>
        ))}
      </ul>
      {meta.total === 0 && <p role="status">{messages.home.emptyBlog}</p>}
      {outOfRange && (
        <div className="space-y-4">
          <p role="status">{messages.home.pageOutOfRange}</p>
          <Link href="/" className={pageLinkClass}>{messages.home.returnToFirstPage}</Link>
        </div>
      )}
      {meta.total > 0 && !outOfRange && (
        <nav aria-label={messages.home.pagination} className="flex flex-wrap items-center justify-center gap-4">
          {meta.page > 1 && (
            <Link href={`/?page=${meta.page - 1}`} className={pageLinkClass}>
              <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />{messages.home.previousPage}
            </Link>
          )}
          <p>{messages.home.page} {fa(String(meta.page))} {messages.home.of} {fa(String(meta.totalPages))}</p>
          {meta.page < meta.totalPages && (
            <Link href={`/?page=${meta.page + 1}`} className={pageLinkClass}>
              {messages.home.nextPage}<ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
