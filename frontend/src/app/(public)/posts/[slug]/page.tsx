import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductionArticleComments } from "@/components/comments/production-article-comments";
import { ProductionBookmarkButton } from "@/components/posts/production-bookmark-button";
import { RichContent } from "@/components/posts/rich-content";
import { loadBookmarkState } from "@/lib/dashboard/bookmarks";
import { messages } from "@/i18n/messages/fa";
import { lookupPublicAccount } from "@/lib/auth/current-user";
import { loadArticleComments } from "@/lib/comments";
import { getPublishedPost } from "@/lib/posts";
import { formatPublicationDate } from "@/lib/publication-date";
import { fa } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ArticleDetail({ params, bookmark }: { params: Promise<{ slug: string }>; bookmark?: React.ReactNode }) {
  const { slug } = await params;
  let post;
  try {
    post = await getPublishedPost(slug);
  } catch {
    return (
      <Card role="alert" className="mx-auto min-h-64 max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">{messages.article.error}</h1>
        <p>{messages.home.feedErrorHelp}</p>
        <form action={`/posts/${encodeURIComponent(slug)}`} method="get">
          <Button type="submit" size="lg" className="motion-reduce:transition-none">{messages.home.retry}</Button>
        </form>
      </Card>
    );
  }
  // Resolve availability before rendering: no streamed success shell before a 404.
  if (!post) notFound();
  const [comments, account] = await Promise.all([
    loadArticleComments(post.id),
    lookupPublicAccount(),
  ]);
  // Only signed-in readers get a toggle; an unverifiable state hides it.
  const saved =
    account.status === "authenticated" ? await loadBookmarkState(post.id) : null;

  return (
    <>
    <article className="mx-auto max-w-3xl space-y-6" aria-labelledby="article-title">
      <Link href="/" className="inline-flex min-h-12 items-center rounded-md px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{messages.article.backToFeed}</Link>
      <Card className="relative">
        {bookmark && <div className="absolute end-4 top-4 sm:end-6 sm:top-6">{bookmark}</div>}
        {post.coverImage && (
          // Covers are normalized server-side; only image URLs from the API payload are used.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage.src}
            alt={post.coverImage.alt}
            width={post.coverImage.width ?? 640}
            height={post.coverImage.height ?? 360}
            className={`${post.coverImage.width && post.coverImage.height ? "" : "aspect-video"} w-full rounded-t-surface border-b border-border object-cover`}
            style={
              post.coverImage.width && post.coverImage.height
                ? { aspectRatio: `${post.coverImage.width} / ${post.coverImage.height}` }
                : undefined
            }
          />
        )}
        <header className={bookmark ? "space-y-6 p-6 pe-20 sm:p-8 sm:pe-24" : "space-y-6 p-6 sm:p-8"}>
          <div className="flex items-start justify-between gap-4">
            <h1 id="article-title" className="text-3xl leading-tight font-bold wrap-anywhere">{fa(post.title)}</h1>
            {saved !== null && account.status === "authenticated" && (
              <ProductionBookmarkButton
                postId={post.id}
                initialSaved={saved}
                csrfToken={account.account.csrfToken}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <p className="wrap-anywhere">{fa(post.authorName)}</p>
            {post.publishedAt !== null && <time dateTime={post.publishedAt}>{formatPublicationDate(post.publishedAt)}</time>}
          </div>
          {post.categories.length > 0 && (
            <ul aria-label={messages.home.categoriesLabel} className="flex flex-wrap gap-2 text-sm">
              {post.categories.map((category) => <li key={category.id} className="rounded-md bg-secondary px-3 py-1 wrap-anywhere">{fa(category.name)}</li>)}
            </ul>
          )}
          {post.tags.length > 0 && (
            <ul aria-label={messages.article.tags} className="flex flex-wrap gap-2 text-sm">
              {post.tags.map((tag) => <li key={tag.id} className="rounded-md border border-border px-3 py-1 wrap-anywhere">{fa(tag.name)}</li>)}
            </ul>
          )}
        </header>
        <section aria-label={messages.article.content} className="border-t border-border p-6 sm:p-8">
          {post.contentDocument ? (
            <div className="wrap-anywhere">
              <RichContent document={post.contentDocument} media={post.contentMedia} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap wrap-anywhere" style={{ unicodeBidi: "plaintext" }}>
              {post.content}
            </div>
          )}
        </section>
      </Card>
    </article>
    <ProductionArticleComments
      postId={post.id}
      slug={post.slug}
      comments={comments}
      account={account}
    />
    </>
  );
}
