import "server-only";
import { AuthorPostList, AuthorPostsUnavailable } from "@/components/dashboard/author-post-list";
import { parseOwnPosts } from "@/lib/own-posts-contract";

export function ownPostsHref(page: number) { return page === 1 ? "/dashboard/posts" : `/dashboard/posts?page=${page}`; }

// Test-host composition only: this is not a live Nest or authorization adapter.
export async function PreviewOwnPosts({ page, authorId }: { page: number; authorId: string }) {
  let posts;
  try {
    const response = await fetch(`http://127.0.0.1:4101/dashboard-posts?page=${page}&limit=10`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Fixture own Posts unavailable");
    posts = parseOwnPosts(await response.json(), page, 10);
    if (posts.data.some(post => post.authorId !== authorId)) throw new Error("Mismatched fixture identity");
  } catch {
    return <AuthorPostsUnavailable page={page} />;
  }
  return <AuthorPostList posts={posts} href={ownPostsHref} formLinks={{ create: "/dashboard/posts/new", edit: id => `/dashboard/posts/${encodeURIComponent(id)}/edit` }} />;
}
