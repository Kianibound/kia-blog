import { Suspense } from "react";
import { PublishedFeed } from "@/components/posts/published-feed";
import { FeedLoading } from "@/components/posts/feed-loading";
import { Card } from "@/components/ui/card";
import { messages } from "@/i18n/messages/fa";

// Keep environment validation and public reads at request time, not during builds.
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const { page: input } = await searchParams;
  const parsed = typeof input === "string" && /^\d+$/.test(input) ? Number(input) : 1;
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;

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
        <Suspense key={page} fallback={<FeedLoading />}>
          <PublishedFeed page={page} />
        </Suspense>
      </section>
    </div>
  );
}
