import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoveryFeed } from "@/components/posts/discovery-feed";
import { FeedLoading } from "@/components/posts/feed-loading";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { messages } from "@/i18n/messages/fa";
import { normalizeSearchState, pagedHref } from "@/lib/discovery";
import type { PostsSearchParams } from "@/lib/posts-query";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<PostsSearchParams>;
}): Promise<Metadata> {
  const state = normalizeSearchState(await searchParams);
  return {
    title: state.q
      ? `${messages.discovery.searchTitle}: ${state.q}`
      : messages.discovery.searchTitle,
    description: messages.discovery.searchDescription,
    alternates: {
      canonical: pagedHref("/search", { ...state, page: 1 }),
    },
    // Filtered result pages are not canonical landing pages.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<PostsSearchParams>;
}) {
  const state = normalizeSearchState(await searchParams);
  const href = pagedHref("/search", state);
  const selectClass =
    "h-12 w-full rounded-field border border-input bg-field px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl leading-tight font-bold">
          {messages.discovery.searchTitle}
        </h1>
        <p>{messages.discovery.searchDescription}</p>
      </section>
      <form
        action="/search"
        method="get"
        role="search"
        aria-label={messages.search.form}
        className="grid gap-4 sm:grid-cols-3"
      >
        <Field
          label={messages.discovery.searchLabel}
          htmlFor="discovery-query"
          className="min-w-0 sm:col-span-2"
        >
          <Input
            id="discovery-query"
            type="search"
            name="q"
            defaultValue={state.q ?? ""}
            className="h-12 motion-reduce:transition-none"
          />
        </Field>
        <Field label={messages.search.sort} htmlFor="discovery-sort">
          <select
            id="discovery-sort"
            name="sort"
            defaultValue={state.sort}
            className={selectClass}
          >
            <option value="newest">{messages.search.newest}</option>
            <option value="oldest">{messages.search.oldest}</option>
          </select>
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" size="lg" className="motion-reduce:transition-none">
            {messages.discovery.searchSubmit}
          </Button>
        </div>
      </form>
      <section aria-labelledby="discovery-results" className="space-y-6">
        <h2 id="discovery-results" className="text-2xl leading-tight font-semibold">
          {messages.home.title}
        </h2>
        <Suspense key={href} fallback={<FeedLoading />}>
          <DiscoveryFeed
            query={{ page: state.page, sort: state.sort, search: state.q }}
            base="/search"
            empty={messages.discovery.searchEmpty}
          />
        </Suspense>
      </section>
    </div>
  );
}
