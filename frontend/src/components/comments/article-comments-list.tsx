"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { commentsMessages as copy } from "@/i18n/messages/comments.fa";
import type { PublicComment, PublicReply } from "@/lib/comments-contract";
import { formatPublicationDate } from "@/lib/publication-date";
import { fa } from "@/lib/utils";

const PAGE_SIZE = 5;

function CommentMeta({ reply }: { reply: PublicReply }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground wrap-anywhere">{fa(reply.authorName)}</p>
      <time dateTime={reply.createdAt}>{formatPublicationDate(reply.createdAt)}</time>
    </div>
  );
}

/**
 * Shows the first 5 comments, then 5 more each time the reader scrolls to
 * the end of the list (with a manual button as fallback).
 */
export function ArticleCommentsList({ comments }: { comments: PublicComment[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const shown = comments.slice(0, visible);
  const hasMore = visible < comments.length;

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((current) => Math.min(current + PAGE_SIZE, comments.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, comments.length]);

  return (
    <div className="space-y-4">
      <p role="status" className="text-sm text-muted-foreground">
        {copy.article.showing} {fa(String(shown.length))} {copy.article.of}{" "}
        {fa(String(comments.length))} {copy.article.commentsCount}
      </p>
      <ul aria-label={copy.article.title} className="space-y-4">
        {shown.map((comment) => (
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
      {hasMore && (
        <>
          <div ref={sentinelRef} aria-hidden="true" className="min-h-4" />
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="motion-reduce:transition-none"
            onClick={() => setVisible((current) => Math.min(current + PAGE_SIZE, comments.length))}
          >
            {copy.article.showMore}
          </Button>
        </>
      )}
    </div>
  );
}
