import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { messages } from "@/i18n/messages/fa";
import type { PostSummary } from "@/lib/posts-contract";
import { fa } from "@/lib/utils";
import { formatPublicationDate } from "@/lib/publication-date";
import Link from "next/link";

export function PostCard({ post, href = `/posts/${encodeURIComponent(post.slug)}`, bookmark }: { post: PostSummary; href?: string; bookmark?: React.ReactNode }) {
  return (
    <article aria-labelledby={`post-${post.id}`} className="h-full">
      <Card className="relative flex h-full flex-col">
        {bookmark && <div className="absolute end-4 top-4 z-10">{bookmark}</div>}
        {/* Fixture image bytes use the existing same-origin proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {post.coverImage && <img src={post.coverImage.src} alt={post.coverImage.alt} width={640} height={360} loading="lazy" className="aspect-video w-full rounded-t-surface object-cover" />}
        <CardHeader className={bookmark ? "pe-20" : undefined}>
          {post.categories.length > 0 && (
            <ul aria-label={messages.home.categoriesLabel} className="mb-3 flex flex-wrap gap-2 text-sm">
              {post.categories.map((category) => (
                <li key={category.id} className="max-w-full rounded-md bg-secondary px-3 py-1 text-secondary-foreground wrap-anywhere">
                  {fa(category.name)}
                </li>
              ))}
            </ul>
          )}
          <h3 id={`post-${post.id}`} className="text-xl leading-tight font-semibold wrap-anywhere">
            <Link href={href} className="inline-flex min-h-12 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              {fa(post.title)}
            </Link>
          </h3>
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <p className="min-w-0 wrap-anywhere">{fa(post.authorName)}</p>
            {post.publishedAt !== null && (
              <time dateTime={post.publishedAt}>
                {formatPublicationDate(post.publishedAt)}
              </time>
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
