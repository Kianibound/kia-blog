import Link from "next/link";
import { ProductionCommentForm } from "@/components/comments/production-comment-form";
import { ArticleCommentsList } from "@/components/comments/article-comments-list";
import { Card } from "@/components/ui/card";
import { commentsMessages as copy } from "@/i18n/messages/comments.fa";
import type { AccountLookup } from "@/lib/auth/current-user";
import type { ArticleCommentsResult } from "@/lib/comments";

export function ProductionArticleComments({
  postId,
  slug,
  comments,
  account,
}: {
  postId: string;
  slug: string;
  comments: ArticleCommentsResult;
  account: AccountLookup;
}) {
  const signIn = `/login?next=${encodeURIComponent(`/posts/${encodeURIComponent(slug)}`)}`;
  return (
    <section aria-labelledby="article-comments-title" className="mx-auto max-w-3xl space-y-6">
      <h2 id="article-comments-title" className="text-2xl leading-tight font-semibold">
        {copy.article.title}
      </h2>

      {comments.status === "success" ? (
        comments.comments.length ? (
          <ArticleCommentsList comments={comments.comments} />
        ) : (
          <Card className="min-h-32 p-6">
            <p role="status">{copy.article.empty}</p>
          </Card>
        )
      ) : (
        <Card role="alert" className="min-h-32 p-6">
          <p>{copy.article.unavailable}</p>
        </Card>
      )}

      {account.status === "authenticated" ? (
        <ProductionCommentForm postId={postId} csrfToken={account.account.csrfToken} />
      ) : account.status === "unauthenticated" ? (
        <Card className="space-y-4 p-6">
          <p>{copy.article.signInPrompt}</p>
          <Link
            href={signIn}
            className="inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-6 font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {copy.article.signIn}
          </Link>
        </Card>
      ) : (
        <Card role="alert" className="p-6">
          <p>{copy.article.formUnavailable}</p>
        </Card>
      )}
    </section>
  );
}
