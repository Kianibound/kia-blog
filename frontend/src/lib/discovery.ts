import type { PostsSearchParams } from "./posts-query.ts";

/** Canonical public discovery routes for Issue #70 (no auth dependency). */

export type DiscoverySort = "newest" | "oldest";
export type DiscoverySearchState = {
  q?: string;
  page: number;
  sort: DiscoverySort;
};

const TAXONOMY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const USERNAME = /^[A-Za-z0-9_]{1,64}$/;

/** Backend slugs are strict ASCII; empty generated slugs are not routable. */
export function isSafeTaxonomySlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 100 && TAXONOMY_SLUG.test(value);
}

/** Nest generates `user_`, `google_`, `github_` and `author_N` usernames. */
export function isSafeAuthorUsername(value: unknown): value is string {
  return typeof value === "string" && USERNAME.test(value);
}

export function categoryHref(slug: string): string {
  return `/categories/${encodeURIComponent(slug)}`;
}

export function tagHref(slug: string): string {
  return `/tags/${encodeURIComponent(slug)}`;
}

export function authorHref(username: string): string {
  return `/authors/${encodeURIComponent(username)}`;
}

/** Query values are trimmed and bounded; unsupported params are ignored. */
export function normalizeSearchState(
  params: PostsSearchParams,
): DiscoverySearchState {
  const rawQ = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const rawPage =
    typeof params.page === "string" && /^\d+$/.test(params.page)
      ? Number(params.page)
      : 1;
  return {
    q: rawQ || undefined,
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    sort: params.sort === "oldest" ? "oldest" : "newest",
  };
}

/** Pagination links keep only the params that change the result set. */
export function pagedHref(
  base: string,
  state: { page: number; sort: DiscoverySort; q?: string },
): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.sort === "oldest") params.set("sort", "oldest");
  if (state.page > 1) params.set("page", String(state.page));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
