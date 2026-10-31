import { createServer } from "node:http";
import { publishedPosts } from "./posts.mjs";
import { previewPosts } from "./preview-posts.mjs";

// Opt-in manual preview keeps the deterministic automated-test dataset unchanged.
const preview = process.env.POSTS_FIXTURE_PREVIEW === "true";

// Category responses are test doubles matching the public Nest taxonomy DTO.
let categoryMode = "success";
let postsMode = "success";
const categories = [
  { id: "20000000-0000-4000-8000-000000000001", name: "توسعهٔ وب", slug: "web", createdAt: "2026-03-19T12:00:00.000Z", updatedAt: "2026-03-19T12:00:00.000Z" },
  // The backend slugifier can produce an empty slug for some names.
  { id: "20000000-0000-4000-8000-000000000002", name: "یادگیری 2026", slug: "", createdAt: "2026-03-19T12:00:00.000Z", updatedAt: "2026-03-19T12:00:00.000Z" },
];

// Minimal external API test double. Strict query handling checks the real wire boundary.
createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:4101");
  if (request.method === "GET" && url.pathname === "/health") {
    response.end("ok");
    return;
  }
  if (request.method === "POST" && url.pathname === "/__test/categories") {
    const mode = url.searchParams.get("mode");
    if (!["success", "empty", "error", "invalid"].includes(mode)) return response.writeHead(400).end();
    categoryMode = mode;
    return response.writeHead(204).end();
  }
  if (request.method === "POST" && url.pathname === "/__test/posts") {
    const mode = url.searchParams.get("mode");
    if (!["success", "empty", "error", "slow", "rate-limit", "malformed", "invalid", "disconnect", "timeout"].includes(mode)) return response.writeHead(400).end();
    postsMode = mode;
    return response.writeHead(204).end();
  }
  if (request.method === "GET" && url.pathname === "/categories" && !url.search && !request.headers.authorization) {
    if (categoryMode === "error") return response.writeHead(503).end();
    response.writeHead(200, { "Content-Type": "application/json" });
    return response.end(JSON.stringify(categoryMode === "empty" ? [] : categoryMode === "invalid" ? [{ id: 1 }] : categories));
  }
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "10");
  const sort = url.searchParams.get("sort") ?? "newest";
  const expectedQuery = new URLSearchParams({ limit: "10", sort: "newest" });
  if (
    request.method !== "GET" ||
    url.pathname !== "/posts" ||
    (preview
      ? [...url.searchParams.keys()].some((key) => !["page", "limit", "sort"].includes(key) || url.searchParams.getAll(key).length !== 1)
      : url.searchParams.size !== 3 || [...expectedQuery].some(([key, value]) => url.searchParams.get(key) !== value)) ||
    !Number.isSafeInteger(page) || page < 1 ||
    !Number.isSafeInteger(limit) || limit < 1 || limit > 50 ||
    !["newest", "oldest"].includes(sort) ||
    request.headers.authorization
  ) {
    response.writeHead(400).end("Unexpected posts request");
    return;
  }
  if (postsMode === "error") return response.writeHead(503).end("TEST DOUBLE: private upstream error");
  if (postsMode === "rate-limit") return response.writeHead(429).end("TEST DOUBLE: rate limit details");
  if (postsMode === "disconnect") return request.socket.destroy();
  if (postsMode === "timeout") return; // The application's real request timeout aborts this socket.
  if (postsMode === "malformed") return response.writeHead(200, { "Content-Type": "application/json" }).end("{TEST DOUBLE");
  if (postsMode === "invalid") return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ data: [{ id: 1 }], meta: { page, limit, total: 1, totalPages: 1 } }));
  response.writeHead(200, { "Content-Type": "application/json" });
  const posts = postsMode === "empty" ? [] : preview ? previewPosts : publishedPosts;
  const ordered = sort === "oldest" ? [...posts].reverse() : posts;
  const body = JSON.stringify({
    data: ordered.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total: posts.length, totalPages: Math.ceil(posts.length / limit) },
  });
  if (postsMode === "slow") setTimeout(() => response.end(body), 2000);
  else response.end(body);
}).listen(4101, "127.0.0.1");
