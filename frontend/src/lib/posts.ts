import "server-only";
import { parsePublishedPost, parsePublishedPosts } from "./posts-contract";
import { postsQueryParams, type PostsQuery } from "./posts-query";

async function requestPosts(path: string, query?: URLSearchParams) {
  const configuredOrigin = process.env.API_BASE_URL;
  if (!configuredOrigin) throw new Error("Missing posts API configuration");

  const origin = new URL(configuredOrigin);
  if (
    !["http:", "https:"].includes(origin.protocol) ||
    origin.username || origin.password || origin.search || origin.hash ||
    origin.pathname !== "/"
  ) {
    throw new Error("Invalid posts API configuration");
  }

  const url = new URL(path, origin);
  if (query) url.search = query.toString();
  return fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}

export async function getPublishedPosts(query: PostsQuery) {
  const params = postsQueryParams(query);
  params.set("page", String(query.page));
  params.set("limit", "10");
  params.set("sort", query.sort);
  const response = await requestPosts("/posts", params);
  if (!response.ok) throw new Error("Unable to load public posts");

  const payload: unknown = await response.json();
  return parsePublishedPosts(payload);
}

export async function getPublishedPost(slug: string) {
  const response = await requestPosts(`/posts/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load public post");
  const payload: unknown = await response.json();
  return parsePublishedPost(payload);
}
