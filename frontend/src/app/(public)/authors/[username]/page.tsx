import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DiscoveryFeed } from "@/components/posts/discovery-feed";
import { FeedLoading } from "@/components/posts/feed-loading";
import { messages } from "@/i18n/messages/fa";
import {
  authorHref,
  isSafeAuthorUsername,
  normalizeSearchState,
  pagedHref,
} from "@/lib/discovery";
import type { PostsSearchParams } from "@/lib/posts-query";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  if (!isSafeAuthorUsername(username))
    return { title: messages.discovery.authorTitle };
  return {
    title: `${messages.discovery.authorPrefix} ${username}`,
    description: messages.discovery.authorDescription,
    alternates: { canonical: authorHref(username) },
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<PostsSearchParams>;
}) {
  const { username } = await params;
  if (!isSafeAuthorUsername(username)) notFound();
  const state = normalizeSearchState(await searchParams);
  const base = authorHref(username);
  const href = pagedHref(base, state);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl leading-tight font-bold wrap-anywhere">
          {messages.discovery.authorPrefix} {username}
        </h1>
        <p>{messages.discovery.authorDescription}</p>
      </div>
      <Suspense key={href} fallback={<FeedLoading />}>
        <DiscoveryFeed
          query={{ page: state.page, sort: state.sort, author: username }}
          base={base}
          empty={messages.discovery.authorEmpty}
        />
      </Suspense>
    </div>
  );
}
