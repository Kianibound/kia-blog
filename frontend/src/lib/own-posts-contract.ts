export type OwnPost = {
  id: string; title: string; slug: string; content: string;
  status: "DRAFT" | "PUBLISHED" | "DEPRECATED";
  authorId: string; publishedAt: string | null; createdAt: string; updatedAt: string;
};
export type OwnPosts = { data: OwnPost[]; meta: { page: number; limit: number; total: number; totalPages: number } };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function date(value: unknown): value is string {
  return typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}

/** Nest MyPostsResponseDto: scalar Post records, no author/taxonomy relations. */
export function parseOwnPosts(value: unknown, page: number, limit: number): OwnPosts {
  if (!record(value) || !Array.isArray(value.data) || !record(value.meta)) throw new Error("Invalid own Posts");
  const meta = value.meta;
  if (meta.page !== page || meta.limit !== limit || typeof meta.total !== "number" || !Number.isSafeInteger(meta.total) || meta.total < 0 || meta.totalPages !== Math.ceil(meta.total / limit) || value.data.length > limit) throw new Error("Invalid own Post pagination");
  const data = value.data.map((post: unknown): OwnPost => {
    if (!record(post) || typeof post.id !== "string" || !post.id.trim() || typeof post.title !== "string" || !post.title.trim() || typeof post.slug !== "string" || typeof post.content !== "string" || typeof post.authorId !== "string" || !post.authorId.trim() || (post.status !== "DRAFT" && post.status !== "PUBLISHED" && post.status !== "DEPRECATED") || (post.publishedAt !== null && !date(post.publishedAt)) || !date(post.createdAt) || !date(post.updatedAt)) throw new Error("Invalid own Post");
    return { id: post.id, title: post.title, slug: post.slug, content: post.content, authorId: post.authorId, status: post.status, publishedAt: post.publishedAt, createdAt: post.createdAt, updatedAt: post.updatedAt };
  });
  return { data, meta: { page, limit, total: meta.total, totalPages: Math.ceil(meta.total / limit) } };
}
