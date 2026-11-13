import Link from "next/link";
import { ProductionCommentForm } from "@/components/comments/production-comment-form";
import { Card } from "@/components/ui/card";
import { commentsMessages as copy } from "@/i18n/messages/comments.fa";
import type { AccountLookup } from "@/lib/auth/current-user";
import type { ArticleCommentsResult } from "@/lib/comments";
import type { PublicReply } from "@/lib/comments-contract";
import { formatPublicationDate } from "@/lib/publication-date";
import { fa } from "@/lib/utils";

function CommentMeta({ reply }: { reply: PublicReply }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground wrap-anywhere">{fa(reply.authorName)}</p>
      <time dateTime={reply.createdAt}>{formatPublicationDate(reply.createdAt)}</time>
    </div>
  );
}

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
          <ul aria-label={copy.article.title} className="space-y-4">
            {comments.comments.map((comment) => (
              <li key={comment.id} className="space-y-4">
                <Card className="space-y-3 p-6">
                  <CommentMeta reply={comment} />
                  <p className="whitespace-pre-wrap wrap-anywhere">{fa(comment.content)}</p>
                </Card>
                {comment.replies.length > 0 && (
                  <ul aria-label={copy.article.replies} className="ms-6 space-y-4 border-s border-border ps-4">
                    {comment.replies.map((reply) => (
                      <li key={reply.id}>
                        <Card className="space-y-3 p-6">
                          <CommentMeta reply={reply} />
                          <p className="whitespace-pre-wrap wrap-anywhere">{fa(reply.content)}</p>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
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
