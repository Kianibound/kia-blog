import { parseCoverImage, type PostSummary } from "./posts-contract.ts";

/** Consumed projection of the live Nest bookmark endpoints (#53). */

export type BookmarkFailureReason =
  | "unauthorized"
  | "not-found"
  | "forbidden"
  | "validation"
  | "unavailable"
  | "protocol";

export type BookmarkOutcome =
  | { state: "success" }
  | { state: "failure"; reason: BookmarkFailureReason }
  | { state: "csrf" }
  | { state: "uncertain" };

export type SavedBookmark = {
  id: string;
  postId: string;
  createdAt: string;
  post: PostSummary;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBookmarkedPost(value: unknown): PostSummary | null {
  if (!isRecord(value) || !isRecord(value.author)) return null;
  if (!isText(value.id) || !isText(value.title) || !isText(value.slug)) return null;
  // GET /bookmarks is published-only; reject anything else rather than linking it.
  if (value.status !== "PUBLISHED") return null;
  if (!(value.publishedAt === null || isText(value.publishedAt))) return null;
  const authorName = value.author.name;
  if (!isText(value.author.username)) return null;
  if (!(authorName === null || typeof authorName === "string")) return null;
  if (!Array.isArray(value.categories)) return null;
  const categories: { id: string; name: string }[] = [];
  for (const category of value.categories) {
    if (!isRecord(category) || !isText(category.id) || !isText(category.name)) return null;
    categories.push({ id: category.id, name: category.name });
  }
  let coverImage: PostSummary["coverImage"];
  try {
    coverImage = parseCoverImage(value.coverImage);
  } catch {
    return null;
  }
  return {
    id: value.id,
    title: value.title,
    slug: value.slug,
    publishedAt: value.publishedAt,
    authorName: authorName?.trim() || value.author.username,
    categories,
    coverImage,
  };
}

export function parseBookmarks(value: unknown): SavedBookmark[] | null {
  if (!Array.isArray(value)) return null;
  const bookmarks: SavedBookmark[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isText(item.id) || !isText(item.postId) || !isText(item.createdAt))
      return null;
    const post = parseBookmarkedPost(item.post);
    if (!post || post.id !== item.postId) return null;
    bookmarks.push({ id: item.id, postId: item.postId, createdAt: item.createdAt, post });
  }
  return bookmarks;
}

/** POST is 201 (also when already saved); DELETE is 200 (also when absent). */
export function bookmarkFailure(status: number): BookmarkFailureReason {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 400 || status === 422) return "validation";
  if (status >= 500) return "unavailable";
  return "protocol";
}
