import "server-only";
import { AuthorPostList, AuthorPostsUnavailable } from "@/components/dashboard/author-post-list";
import { parseOwnPosts } from "@/lib/own-posts-contract";
import type { OwnPostStatusFilter } from "@/lib/own-posts-contract";

export function ownPostsHref(page: number, status?: OwnPostStatusFilter) {
  const query = new URLSearchParams();
  if (page !== 1) query.set("page", String(page));
  if (status) query.set("status", status);
  return `/dashboard/posts${query.size ? `?${query}` : ""}`;
}

// Test-host composition only: this is not a live Nest or authorization adapter.
export async function PreviewOwnPosts({ page, authorId, status }: { page: number; authorId: string; status?: OwnPostStatusFilter }) {
  let posts;
  try {
    const response = await fetch(`http://127.0.0.1:4101/dashboard-posts?page=${page}&limit=10${status ? `&status=${status}` : ""}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture own Posts unavailable");
    posts = parseOwnPosts(await response.json(), page, 10);
    if (posts.data.some(post => post.authorId !== authorId)) throw new Error("Mismatched fixture identity");
    if (status && posts.data.some(post => post.status !== status)) throw new Error("Mismatched fixture status");
  } catch {
    return <AuthorPostsUnavailable page={page} status={status} />;
  }
  return <AuthorPostList posts={posts} status={status} href={page => ownPostsHref(page, status)} formLinks={{ create: "/dashboard/posts/new", edit: id => `/dashboard/posts/${encodeURIComponent(id)}/edit` }} />;
}
