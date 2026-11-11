export type OwnPost = {
  id: string; title: string; slug: string; content: string;
  status: "DRAFT" | "PUBLISHED" | "DEPRECATED";
  authorId: string; publishedAt: string | null; createdAt: string; updatedAt: string;
};
export type OwnPosts = { data: OwnPost[]; meta: { page: number; limit: number; total: number; totalPages: number } };
export type OwnPostStatusFilter = "DRAFT" | "PUBLISHED";
export type AdminInventoryPost = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "DEPRECATED";
  authorId: string;
  author: { id: string; name: string | null; username: string; avatarUrl: string | null };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type AdminInventory = {
  data: AdminInventoryPost[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
export type AdminPosts = Omit<OwnPosts, "data"> & { data: (OwnPost & { author: { id: string; name: string | null; username: string } })[] };

/** Test-preview inventory projection, not a production ADMIN API contract. */
export function parseAdminPosts(value: unknown, page: number, limit: number): AdminPosts {
  const posts = parseOwnPosts(value, page, limit);
  if (!record(value) || !Array.isArray(value.data)) throw new Error("Invalid ADMIN Posts");
  const raw = value.data;
  return { ...posts, data: posts.data.map((post, index) => {
    const author: unknown = raw[index]?.author;
    if (!record(author) || author.id !== post.authorId || (author.name !== null && typeof author.name !== "string") || typeof author.username !== "string" || !author.username.trim()) throw new Error("Invalid ADMIN Post author");
    return { ...post, author: { id: post.authorId, name: author.name, username: author.username } };
  }) };
}

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

/** AUTHOR inventory must remain scoped to the verified Nest user. */
export function parseAuthorInventory(value: unknown, page: number, limit: number, authorId: string): OwnPosts {
  const posts = parseOwnPosts(value, page, limit);
  if (posts.data.some((post) => post.authorId !== authorId)) throw new Error("Invalid own Post owner");
  return posts;
}

/** Nest AdminPostsResponseDto: compact inventory with safe author summaries. */
export function parseAdminInventory(value: unknown, page: number, limit: number): AdminInventory {
  if (!record(value) || !Array.isArray(value.data) || !record(value.meta)) throw new Error("Invalid admin inventory");
  const meta = value.meta;
  if (meta.page !== page || meta.limit !== limit || typeof meta.total !== "number" || !Number.isSafeInteger(meta.total) || meta.total < 0 || meta.totalPages !== Math.ceil(meta.total / limit) || value.data.length > limit) throw new Error("Invalid admin inventory pagination");
  const data = value.data.map((post: unknown): AdminInventoryPost => {
    if (!record(post) || typeof post.id !== "string" || !post.id.trim() || typeof post.title !== "string" || !post.title.trim() || typeof post.slug !== "string" || typeof post.authorId !== "string" || !post.authorId.trim() || (post.status !== "DRAFT" && post.status !== "PUBLISHED" && post.status !== "DEPRECATED") || (post.publishedAt !== null && !date(post.publishedAt)) || !date(post.createdAt) || !date(post.updatedAt)) throw new Error("Invalid admin inventory post");
    const author = post.author;
    if (!record(author) || author.id !== post.authorId || typeof author.username !== "string" || !author.username.trim() || (author.name !== null && typeof author.name !== "string") || (author.avatarUrl !== null && typeof author.avatarUrl !== "string")) throw new Error("Invalid admin inventory author");
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      authorId: post.authorId,
      author: { id: author.id, username: author.username, name: author.name, avatarUrl: author.avatarUrl },
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  });
  return { data, meta: { page, limit, total: meta.total, totalPages: Math.ceil(meta.total / limit) } };
}

export function inventoryPage(value: unknown): number {
  const numeric = typeof value === "string" && /^[1-9]\d*$/.test(value) ? Number(value) : 1;
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : 1;
}

export function inventoryStatus(value: unknown): OwnPostStatusFilter | undefined | null {
  if (value === undefined) return undefined;
  return value === "DRAFT" || value === "PUBLISHED" ? value : null;
}

export function inventoryPath(role: "AUTHOR" | "ADMIN", page: number, status?: OwnPostStatusFilter): string {
  const params = new URLSearchParams({ page: String(page), limit: "10" });
  if (role === "AUTHOR" && status) params.set("status", status);
  return role === "ADMIN" ? `/posts/admin/inventory?${params}` : `/posts/mine?${params}`;
}

export function inventoryHref(role: "AUTHOR" | "ADMIN", page: number, status?: OwnPostStatusFilter): string {
  const params = new URLSearchParams();
  if (page !== 1) params.set("page", String(page));
  if (role === "AUTHOR" && status) params.set("status", status);
  return `/dashboard/posts${params.size ? `?${params}` : ""}`;
}
