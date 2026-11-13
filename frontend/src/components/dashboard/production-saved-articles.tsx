"use client";

import { useRef, useState } from "react";
import { PostCard } from "@/components/posts/post-card";
import { ProductionBookmarkButton } from "@/components/posts/production-bookmark-button";
import { Card } from "@/components/ui/card";
import { bookmarksMessages as copy } from "@/i18n/messages/bookmarks.fa";
import type { SavedBookmark } from "@/lib/bookmarks-contract";

export function ProductionSavedArticles({
  initialBookmarks,
  csrfToken,
}: {
  initialBookmarks: SavedBookmark[];
  csrfToken: string;
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [removed, setRemoved] = useState(false);
  const feedback = useRef<HTMLParagraphElement>(null);

  return (
    <section aria-label={copy.listLabel} className="min-h-64 space-y-6">
      {bookmarks.length ? (
        <ul className="grid gap-6 md:grid-cols-2">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="min-w-0">
              <PostCard
                post={bookmark.post}
                bookmark={
                  <ProductionBookmarkButton
                    postId={bookmark.postId}
                    initialSaved
                    csrfToken={csrfToken}
                    onChange={(saved) => {
                      if (saved) return;
                      setBookmarks((current) =>
                        current.filter((item) => item.id !== bookmark.id),
                      );
                      setRemoved(true);
                      requestAnimationFrame(() => feedback.current?.focus());
                    }}
                  />
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <Card className="min-h-64 p-6">
          <p role="status">{copy.empty}</p>
        </Card>
      )}
      <p
        ref={feedback}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="min-h-12"
      >
        {removed ? copy.removed : ""}
      </p>
    </section>
  );
}
