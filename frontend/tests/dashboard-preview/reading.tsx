import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { publicationMessages as copy } from "@/i18n/messages/publication.fa";
import { formatPublicationDate } from "@/lib/publication-date";
import { parseOwnPosts } from "@/lib/own-posts-contract";
import { fa } from "@/lib/utils";

async function read(slug?: string) {
  const response = await fetch(`http://127.0.0.1:4101/dashboard-public-posts${slug === undefined ? "" : `/${encodeURIComponent(slug)}`}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Fixture reading unavailable");
  const payload: unknown = await response.json();
  const data = slug === undefined ? payload : [payload];
  if (!Array.isArray(data)) throw new Error("Invalid fixture reading");
  const posts = parseOwnPosts({ data, meta: { page: 1, limit: Math.max(1, data.length), total: data.length, totalPages: data.length ? 1 : 0 } }, 1, Math.max(1, data.length)).data;
  if (posts.some(post => post.status !== "PUBLISHED" || (slug !== undefined && post.slug !== slug))) throw new Error("Invalid fixture public visibility");
  return posts;
}

export async function PreviewReading({ slug }: { slug?: string }) {
  let posts;
  try { posts = await read(slug); }
  catch { return <Card role="alert" className="min-h-64 p-6"><p>{copy.readingUnavailable}</p></Card>; }
  if (posts === null) notFound();
  return <main className="mx-auto min-h-96 max-w-3xl space-y-6 px-4 py-8">
    <h1 className="text-3xl leading-tight font-semibold">{copy.readingTitle}</h1>
    <p>{copy.readingHelp}</p>
    <Link prefetch={false} href="/preview/posts" className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring">{copy.back}</Link>
    {posts.length === 0 && <p>{copy.readingEmpty}</p>}
    {posts.map(post => <article key={post.id} className="space-y-4"><Card className="space-y-4 p-6">
      <h2 className="text-2xl font-semibold leading-tight wrap-anywhere">{slug === undefined ? <Link prefetch={false} href={`/preview/posts/${encodeURIComponent(post.slug)}`} className="inline-flex min-h-12 items-center underline">{fa(post.title)}</Link> : fa(post.title)}</h2>
      {post.publishedAt && <time dateTime={post.publishedAt}>{formatPublicationDate(post.publishedAt)}</time>}
      {slug !== undefined && <div className="whitespace-pre-wrap wrap-anywhere" style={{ unicodeBidi: "plaintext" }}>{post.content}</div>}
    </Card></article>)}
  </main>;
}
