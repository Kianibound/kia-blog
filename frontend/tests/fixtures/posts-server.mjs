import { createServer } from "node:http";
import { publishedPosts } from "./posts.mjs";

// Category responses are test doubles matching the public Nest taxonomy DTO.
let categoryMode = "success";
let postsEmpty = false;
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
    if (!["success", "empty"].includes(mode)) return response.writeHead(400).end();
    postsEmpty = mode === "empty";
    return response.writeHead(204).end();
  }
  if (request.method === "GET" && url.pathname === "/categories" && !url.search && !request.headers.authorization) {
    if (categoryMode === "error") return response.writeHead(503).end();
    response.writeHead(200, { "Content-Type": "application/json" });
    return response.end(JSON.stringify(categoryMode === "empty" ? [] : categoryMode === "invalid" ? [{ id: 1 }] : categories));
  }
  const page = Number(url.searchParams.get("page"));
  const expectedQuery = new URLSearchParams({ limit: "10", sort: "newest" });
  if (
    request.method !== "GET" ||
    url.pathname !== "/posts" ||
    url.searchParams.size !== 3 ||
    !Number.isSafeInteger(page) || page < 1 ||
    [...expectedQuery].some(([key, value]) => url.searchParams.get(key) !== value) ||
    request.headers.authorization
  ) {
    response.writeHead(400).end("Unexpected posts request");
    return;
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  const posts = postsEmpty ? [] : publishedPosts;
  response.end(JSON.stringify({
    data: posts.slice((page - 1) * 10, page * 10),
    meta: { page, limit: 10, total: posts.length, totalPages: Math.ceil(posts.length / 10) },
  }));
}).listen(4101, "127.0.0.1");
