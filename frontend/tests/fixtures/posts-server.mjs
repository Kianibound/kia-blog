import { createServer } from "node:http";
import { feed } from "./posts.mjs";

// Minimal external API test double. Strict query handling checks the real wire boundary.
createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:4101");
  if (request.method === "GET" && url.pathname === "/health") {
    response.end("ok");
    return;
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
