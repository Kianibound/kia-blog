import { createServer } from "node:http";
import { feed } from "./posts.mjs";

// Category responses are test doubles matching the public Nest taxonomy DTO.
let categoryMode = "success";
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
  if (request.method === "GET" && url.pathname === "/categories" && !url.search && !request.headers.authorization) {
    if (categoryMode === "error") return response.writeHead(503).end();
    response.writeHead(200, { "Content-Type": "application/json" });
    return response.end(JSON.stringify(categoryMode === "empty" ? [] : categoryMode === "invalid" ? [{ id: 1 }] : categories));
  }
  const expectedQuery = new URLSearchParams({ page: "1", limit: "10", sort: "newest" });
  if (
    request.method !== "GET" ||
    url.pathname !== "/posts" ||
    url.searchParams.size !== 3 ||
    [...expectedQuery].some(([key, value]) => url.searchParams.get(key) !== value) ||
    request.headers.authorization
  ) {
    response.writeHead(400).end("Unexpected posts request");
    return;
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(feed));
}).listen(4101, "127.0.0.1");
