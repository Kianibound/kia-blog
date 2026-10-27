import { Card, CardHeader } from "@/components/ui/card";
import { messages } from "@/i18n/messages/fa";
import type { PostSummary } from "@/lib/posts-contract";
import { fa } from "@/lib/utils";

// Intl applies the Tehran date boundary before formatting in the Jalali calendar.
const publicationDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article aria-labelledby={`post-${post.id}`} className="h-full">
      <Card className="h-full">
        <CardHeader>
          <h2 id={`post-${post.id}`} className="text-xl leading-tight font-semibold wrap-anywhere">
            {fa(post.title)}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <p className="min-w-0 wrap-anywhere">{fa(post.authorName)}</p>
            {post.publishedAt !== null && (
              <time dateTime={post.publishedAt}>
                {publicationDate.format(new Date(post.publishedAt))}
              </time>
            )}
          </div>
          {post.categories.length > 0 && (
            <ul aria-label={messages.home.categoriesLabel} className="mt-4 flex flex-wrap gap-2 text-sm">
              {post.categories.map((category) => (
                <li key={category.id} className="max-w-full rounded-md bg-secondary px-3 py-1 text-secondary-foreground wrap-anywhere">
                  {fa(category.name)}
                </li>
              ))}
            </ul>
          )}
        </CardHeader>
      </Card>
    </article>
  );
}
