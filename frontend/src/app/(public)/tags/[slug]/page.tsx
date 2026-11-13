import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DiscoveryFeed } from "@/components/posts/discovery-feed";
import { FeedLoading } from "@/components/posts/feed-loading";
import { messages } from "@/i18n/messages/fa";
import {
  isSafeTaxonomySlug,
  normalizeSearchState,
  pagedHref,
  tagHref,
} from "@/lib/discovery";
import type { PostsSearchParams } from "@/lib/posts-query";
import { getEditorTaxonomy } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

async function resolveName(slug: string): Promise<string | null> {
  const taxonomy = await getEditorTaxonomy();
  return taxonomy?.tags.find((item) => item.slug === slug)?.name ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isSafeTaxonomySlug(slug)) return { title: messages.discovery.tagsTitle };
  const name = await resolveName(slug);
  return {
    title: name
      ? `${name} | ${messages.discovery.tagsTitle}`
      : `${messages.discovery.tagsTitle}: ${slug}`,
    description: messages.discovery.tagsDescription,
    alternates: { canonical: tagHref(slug) },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PostsSearchParams>;
}) {
  const { slug } = await params;
  if (!isSafeTaxonomySlug(slug)) notFound();
  const name = (await resolveName(slug)) ?? slug;
  const state = normalizeSearchState(await searchParams);
  const base = tagHref(slug);
  const href = pagedHref(base, state);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/tags"
          className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {messages.discovery.backToTags}
        </Link>
        <h1 className="text-3xl leading-tight font-bold wrap-anywhere">{name}</h1>
        <p>{messages.discovery.tagsDescription}</p>
      </div>
      <Suspense key={href} fallback={<FeedLoading />}>
        <DiscoveryFeed
          query={{ page: state.page, sort: state.sort, tag: slug }}
          base={base}
          empty={messages.discovery.tagEmpty}
        />
      </Suspense>
    </div>
  );
}
