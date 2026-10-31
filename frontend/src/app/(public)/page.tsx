import { PostCard } from "@/components/posts/post-card";
import { Card } from "@/components/ui/card";
import { messages } from "@/i18n/messages/fa";
import { getPublishedPosts } from "@/lib/posts";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { fa } from "@/lib/utils";

// Keep environment validation and public reads at request time, not during builds.
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const { page: input } = await searchParams;
  const parsed = typeof input === "string" && /^\d+$/.test(input) ? Number(input) : 1;
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
  const { data: posts, meta } = await getPublishedPosts(page);
  const outOfRange = posts.length === 0 && meta.page > meta.totalPages && meta.total > 0;
  const pageLinkClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border px-4 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

  return (
    <div className="space-y-10 sm:space-y-12">
      <section aria-labelledby="welcome-heading">
        <Card>
          <div className="space-y-6 p-6 sm:p-10">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-medium text-brand">{messages.home.eyebrow}</p>
              <h1 id="welcome-heading" className="text-3xl leading-tight font-bold sm:text-4xl">
                {messages.home.heroTitle}
              </h1>
              <p className="max-w-2xl">{messages.home.description}</p>
            </div>
            <a
              href="#published-posts"
              className="inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-6 font-semibold text-brand-foreground hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {messages.home.browseArticles}
            </a>
          </div>
        </Card>
      </section>
      <section id="published-posts" aria-labelledby="published-posts-title" tabIndex={-1} className="scroll-mt-6 space-y-6">
        <div className="space-y-2">
          <h2 id="published-posts-title" className="text-2xl leading-tight font-semibold">{messages.home.title}</h2>
          <p>{messages.home.feedDescription}</p>
        </div>
        <ul aria-label={messages.home.feedLabel} className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <li key={post.id} className="min-w-0">
              <PostCard post={post} />
            </li>
          ))}
        </ul>
        {meta.total === 0 && <p>{messages.home.emptyBlog}</p>}
        {outOfRange && (
          <div className="space-y-4">
            <p>{messages.home.pageOutOfRange}</p>
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
      </section>
    </div>
  );
}
