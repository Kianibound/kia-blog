"use client";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/posts/post-card";
import { BookmarkToggle } from "@/components/posts/bookmark-toggle";
import type { BookmarkWriteResult, PostSummary } from "@/lib/posts-contract";

export function SavedArticles({ initialPosts, action }: { initialPosts: PostSummary[]; action: (slug: string, saved: boolean) => Promise<BookmarkWriteResult> }) {
  const [posts, setPosts] = useState(initialPosts);
  const [removed, setRemoved] = useState(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  return <section aria-label="فهرست مقالات ذخیره‌شده" className="min-h-256 space-y-6">
    {posts.length ? <ul className="grid gap-6 md:grid-cols-2">{posts.map(post => <li key={post.id} className="min-w-0 space-y-4">
      <div><PostCard post={post} /></div>
      <BookmarkToggle initialSaved action={saved => action(post.slug, saved)} onChange={saved => {
        if (!saved) { setPosts(current => current.filter(item => item.id !== post.id)); setRemoved(true); requestAnimationFrame(() => feedback.current?.focus()); }
      }} />
    </li>)}</ul> : <Card className="min-h-64 p-6"><p>هنوز مقاله‌ای ذخیره نکرده‌اید.</p></Card>}
    <p ref={feedback} tabIndex={-1} role={removed ? "status" : undefined} aria-live="polite" className="min-h-24">{removed ? "مقاله از ذخیره‌شده‌ها حذف شد." : ""}</p>
  </section>;
}
