// Consumed projection of Nest's PostFeedResponseDto. Unused fields are ignored.
type PostFeedResponse = {
  data: {
    id: string;
    title: string;
    slug: string;
    status: "PUBLISHED";
    publishedAt: string | null;
    author: { username: string; name: string | null };
    categories: { id: string; name: string }[];
  }[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  authorName: string;
  categories: { id: string; name: string }[];
};

type Taxonomy = { id: string; name: string; slug: string };
export type PostDetail = PostSummary & {
  content: string;
  categories: Taxonomy[];
  tags: Taxonomy[];
};

function isTaxonomy(value: unknown): value is Taxonomy {
  return isRecord(value) && isText(value.id) && isText(value.name) && typeof value.slug === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isInteger(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}

function isPost(value: unknown): value is PostFeedResponse["data"][number] {
  return (
    isRecord(value) &&
    isText(value.id) &&
    isText(value.title) &&
    typeof value.slug === "string" &&
    value.status === "PUBLISHED" &&
    (value.publishedAt === null ||
      (typeof value.publishedAt === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value.publishedAt) &&
        Number.isFinite(Date.parse(value.publishedAt)))) &&
    isRecord(value.author) &&
    isText(value.author.username) &&
    (value.author.name === null || typeof value.author.name === "string") &&
    Array.isArray(value.categories) &&
    value.categories.every((category: unknown) =>
      isRecord(category) && isText(category.id) && isText(category.name))
  );
}

function isPostFeed(value: unknown): value is PostFeedResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isPost) &&
    isRecord(value.meta) &&
    isInteger(value.meta.page, 1) &&
    isInteger(value.meta.limit, 1) && value.meta.limit <= 50 &&
    isInteger(value.meta.total, 0) &&
    isInteger(value.meta.totalPages, 0) &&
    value.data.length <= value.meta.limit
  );
}

/** Validate the HTTP response before exposing only feed-safe presentation data. */
export function parsePublishedPosts(payload: unknown): { data: PostSummary[]; meta: PostFeedResponse["meta"] } {
  if (!isPostFeed(payload)) throw new Error("Invalid public posts response");

  return {
    data: payload.data.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      publishedAt: post.publishedAt,
      authorName: post.author.name?.trim() || post.author.username,
      categories: post.categories.map(({ id, name }) => ({ id, name })),
    })),
    meta: { ...payload.meta },
  };
}

/** Consumed projection of the single-object PostDetailResponseDto. */
export function parsePublishedPost(payload: unknown): PostDetail {
  if (!isRecord(payload)) throw new Error("Invalid public post response");
  const { content, tags } = payload;
  if (!isPost(payload) || !isText(content) ||
    !payload.categories.every(isTaxonomy) || !Array.isArray(tags) || !tags.every(isTaxonomy)) {
    throw new Error("Invalid public post response");
  }
  return {
    id: payload.id,
    title: payload.title,
    slug: payload.slug,
    content,
    publishedAt: payload.publishedAt,
    authorName: payload.author.name?.trim() || payload.author.username,
    categories: payload.categories.map(({ id, name, slug }) => ({ id, name, slug })),
    tags: tags.map(({ id, name, slug }) => ({ id, name, slug })),
  };
}
