import "server-only";
import { parsePublishedPosts } from "./posts-contract";

export async function getPublishedPosts(page: number) {
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

  const url = new URL("/posts", origin);
  url.search = new URLSearchParams({ page: String(page), limit: "10", sort: "newest" }).toString();
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Unable to load public posts");

  const payload: unknown = await response.json();
  return parsePublishedPosts(payload);
}
