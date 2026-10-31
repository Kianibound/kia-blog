export type PostsQuery = {
  page: number;
  sort: "newest" | "oldest";
  search?: string;
  category?: string;
  tag?: string;
};

export type PostsSearchParams = Record<string, string | string[] | undefined>;

export function normalizePostsQuery(params: PostsSearchParams): PostsQuery {
  const parsedPage = typeof params.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const search = typeof params.search === "string" ? params.search.trim() : "";
  return {
    page: Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    sort: params.sort === "oldest" ? "oldest" : "newest",
    search: search || undefined,
    category: typeof params.category === "string" && params.category.trim() ? params.category : undefined,
    tag: typeof params.tag === "string" && params.tag.trim() ? params.tag : undefined,
  };
}

export function postsQueryParams(query: PostsQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.category) params.set("category", query.category);
  if (query.tag) params.set("tag", query.tag);
  if (query.page !== 1) params.set("page", String(query.page));
  return params;
}

export function postsHref(query: PostsQuery): string {
  const search = postsQueryParams(query).toString();
  return search ? `/?${search}` : "/";
}
