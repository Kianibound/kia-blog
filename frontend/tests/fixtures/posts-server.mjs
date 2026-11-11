import { createServer } from "node:http";
import { publishedPosts } from "./posts.mjs";
import { previewPosts } from "./preview-posts.mjs";
import { handleDashboardFixture } from "./dashboard.mjs";

// Opt-in manual preview keeps the deterministic automated-test dataset unchanged.
const preview = process.env.POSTS_FIXTURE_PREVIEW === "true";

// Category responses are test doubles matching the public Nest taxonomy DTO.
let categoryMode = "success";
let postsMode = "success";
let detailMode = "success";
const privatePosts = [
  { ...publishedPosts[0], id: "50000000-0000-4000-8000-000000000001", slug: "draft-post", status: "DRAFT", publishedAt: null, content: "PRIVATE TEST DOUBLE" },
  { ...publishedPosts[0], id: "50000000-0000-4000-8000-000000000002", slug: "deprecated-post", status: "DEPRECATED", content: "PRIVATE TEST DOUBLE" },
];
const categories = [
  { id: "20000000-0000-4000-8000-000000000001", name: "توسعهٔ وب", slug: "web", createdAt: "2026-03-19T12:00:00.000Z", updatedAt: "2026-03-19T12:00:00.000Z" },
  // The backend slugifier can produce an empty slug for some names.
  { id: "20000000-0000-4000-8000-000000000002", name: "یادگیری 2026", slug: "", createdAt: "2026-03-19T12:00:00.000Z", updatedAt: "2026-03-19T12:00:00.000Z" },
];

const tags = [
  { id: "30000000-0000-4000-8000-000000000001", name: "ری‌اکت", slug: "react", createdAt: "2026-03-19T12:00:00.000Z", updatedAt: "2026-03-19T12:00:00.000Z" },
  { id: "30000000-0000-4000-8000-000000000002", name: "نست", slug: "nest", createdAt: "2026-03-19T12:00:00.000Z", updatedAt: "2026-03-19T12:00:00.000Z" },
];

const editorPosts = new Map();

function readJson(request) {
  return new Promise((resolve) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try { resolve(JSON.parse(body)); } catch { resolve(null); }
    });
  });
}

// Test-only Upstash REST double. Never used by the production application.
const redis = new Map();
let authMode = "normal";
let lastAuthUser = null;
let inventoryMode = "success";
let lastArticleWrite = null;

function redisGet(key) {
  const entry = redis.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) { redis.delete(key); return null; }
  return entry.value;
}

async function handleRedis(request, response) {
  const command = await readJson(request);
  if (!Array.isArray(command) || typeof command[0] !== "string") {
    response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "bad command" }));
    return;
  }
  const [name, key, value, ...rest] = command;
  let result = null;
  if (name === "GET") {
    result = redisGet(String(key));
  } else if (name === "DEL") {
    result = redis.delete(String(key)) ? 1 : 0;
  } else if (name === "SET") {
    const index = rest.indexOf("EX");
    const ttl = index >= 0 ? Number(rest[index + 1]) : 0;
    const mode = rest.includes("NX") ? "NX" : rest.includes("XX") ? "XX" : "";
    const exists = redisGet(String(key)) !== null;
    if ((mode === "NX" && exists) || (mode === "XX" && !exists)) result = null;
    else {
      redis.set(String(key), { value: String(value), expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : Number.MAX_SAFE_INTEGER });
      result = "OK";
    }
  }
  response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ result }));
}

function userFor(email) {
  const role = email.includes("admin") ? "ADMIN" : email.includes("author") ? "AUTHOR" : "USER";
  return {
    id: "90000000-0000-4000-8000-000000000001",
    email,
    username: "user_fixture",
    name: null,
    emailVerified: false,
    role: { name: role },
  };
}

function inventoryPost(index, status, authorId) {
  return {
    id: `post-${index}`,
    title: `مقالهٔ آزمایشی ${index}`,
    slug: `test-post-${index}`,
    content: `متن آزمایشی ${index}`,
    status,
    authorId,
    publishedAt: status === "DRAFT" ? null : "2026-01-02T10:00:00.000Z",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
  };
}

function inventoryMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function authorInventory(authorId, status, page, limit) {
  const statuses = ["DRAFT", "PUBLISHED", "DEPRECATED"];
  const all = Array.from({ length: 12 }, (_, index) => inventoryPost(index + 1, statuses[index % 3], authorId));
  const filtered = status ? all.filter((post) => post.status === status) : all;
  const start = (page - 1) * limit;
  return { data: filtered.slice(start, start + limit), meta: inventoryMeta(page, limit, filtered.length) };
}

function adminInventory(page, limit) {
  const posts = [
    inventoryPost(1, "DRAFT", "author-1"),
    inventoryPost(2, "PUBLISHED", "author-1"),
    inventoryPost(3, "DEPRECATED", "author-2"),
    inventoryPost(4, "PUBLISHED", "author-2"),
    inventoryPost(5, "DRAFT", "author-3"),
  ];
  const authors = {
    "author-1": { id: "author-1", username: "sara", name: "سارا", avatarUrl: null },
    "author-2": { id: "author-2", username: "nima", name: null, avatarUrl: null },
    "author-3": { id: "author-3", username: "mina", name: "مینا", avatarUrl: null },
  };
  const start = (page - 1) * limit;
  return {
    data: posts.slice(start, start + limit).map((post) => {
      const summary = { ...post };
      delete summary.content;
      return { ...summary, author: authors[post.authorId] };
    }),
    meta: inventoryMeta(page, limit, posts.length),
  };
}

function articleResponse(post) {
  return {
    ...post,
    coverImage: null,
    contentMedia: [],
    categories: categories.filter((item) => post.categoryIds.includes(item.id)),
    tags: tags.filter((item) => post.tagIds.includes(item.id)),
    author: { id: post.authorId, username: "sara", name: "سارا", avatarUrl: null },
  };
}

function editorPost(id, title, status, authorId, contentDocument, categoryIds = [], tagIds = []) {
  return {
    id,
    title,
    slug: `editor-${id}`,
    content: "متن مقاله",
    contentDocument,
    status,
    authorId,
    publishedAt: status === "DRAFT" ? null : "2026-01-02T10:00:00.000Z",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
    categoryIds,
    tagIds,
  };
}

function ensureEditorSeed(authorId) {
  if (!editorPosts.has("post-1")) {
    editorPosts.set("post-1", editorPost("post-1", "مقالهٔ قابل ویرایش", "DRAFT", authorId, {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "متن اولیه" }] }],
    }, [categories[0].id], [tags[0].id]));
  }
  if (!editorPosts.has("post-2")) {
    editorPosts.set("post-2", editorPost("post-2", "مقالهٔ نویسندهٔ دیگر", "DRAFT", "other-author", {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "متن دیگر" }] }],
    }));
  }
  if (!editorPosts.has("post-3")) {
    editorPosts.set("post-3", editorPost("post-3", "مقالهٔ کنارگذاشته", "DEPRECATED", authorId, {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "متن بازنشر" }] }],
    }, [categories[0].id]));
  }
  if (!editorPosts.has("post-4")) {
    const legacy = editorPost("post-4", "مقالهٔ متنی قدیمی", "DRAFT", authorId, null);
    legacy.content = "متن قدیمی\nخط دوم";
    editorPosts.set("post-4", legacy);
  }
  if (!editorPosts.has("post-5")) {
    editorPosts.set("post-5", editorPost("post-5", "مقالهٔ تصویری", "DRAFT", authorId, {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "متن تصویر" }] },
        { type: "image", attrs: { mediaId: "40000000-0000-4000-8000-000000000001", alt: "تصویر متن" } },
      ],
    }, [categories[0].id]));
  }
  if (!editorPosts.has("post-6")) {
    editorPosts.set("post-6", editorPost("post-6", "مقالهٔ تصویر ناسازگار", "DRAFT", authorId, {
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://example.test/temp.png", alt: "تصویر موقت" } }],
    }));
  }
  if (!editorPosts.has("post-7")) {
    editorPosts.set("post-7", editorPost("post-7", "مقالهٔ منتشرشده", "PUBLISHED", authorId, {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "متن منتشرشده" }] }],
    }, [categories[0].id]));
  }
}

// Minimal external API test double. Strict query handling checks the real wire boundary.
createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:4101");
  if (handleDashboardFixture(request, response, url, categories)) return;
  if (request.method === "GET" && url.pathname === "/health") {
    response.end("ok");
    return;
  }
  if (request.method === "POST" && url.pathname === "/redis") {
    return handleRedis(request, response);
  }
  if (request.method === "POST" && url.pathname === "/auth/register") {
    const body = await readJson(request);
    const email = typeof body?.email === "string" ? body.email : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Invalid email" }));
    if (email.includes("taken")) return response.writeHead(409, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Account exists" }));
    if (email.includes("limited")) return response.writeHead(429, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Too many requests" }));
    if (email.includes("fail")) return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    return response.writeHead(201, { "Content-Type": "application/json" }).end(JSON.stringify({
      message: "Registration successful. Log in with your email and password. No session was created.",
      user: {
        id: "90000000-0000-4000-8000-000000000001",
        email,
        username: "user_fixture",
        name: null,
        emailVerified: false,
        role: { name: "USER" },
      },
    }));
  }
  if (request.method === "POST" && url.pathname === "/auth/login") {
    const body = await readJson(request);
    const email = typeof body?.email === "string" ? body.email : "";
    if (email.includes("limited")) return response.writeHead(429, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Too many requests" }));
    if (email.includes("fail")) return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (!email || email.includes("bad") || email.includes("disabled")) return response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Invalid email or password." }));
    lastAuthUser = userFor(email);
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({
      accessToken: "fixture-access-token",
      refreshToken: "fixture-refresh-token",
      user: lastAuthUser,
    }));
  }
  if (request.method === "GET" && url.pathname === "/auth/me") {
    if (authMode === "unavailable") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (authMode === "revoke" || !lastAuthUser || !request.headers.authorization) return response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unauthorized" }));
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(lastAuthUser));
  }
  if (request.method === "POST" && url.pathname === "/auth/refresh") {
    if (authMode === "unavailable") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (authMode === "revoke" || !lastAuthUser) return response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unauthorized" }));
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ accessToken: "fixture-access-refreshed" }));
  }
  if (request.method === "POST" && url.pathname === "/auth/logout") {
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Logged out successfully." }));
  }
  if (request.method === "GET" && url.pathname === "/posts/mine") {
    if (authMode === "unavailable") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (authMode === "revoke" || !lastAuthUser) return response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unauthorized" }));
    if (lastAuthUser.role.name !== "AUTHOR" && lastAuthUser.role.name !== "ADMIN") return response.writeHead(403, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Forbidden" }));
    if (inventoryMode === "error") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (inventoryMode === "forbidden") return response.writeHead(403, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Forbidden" }));
    if (inventoryMode === "empty") return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ data: [], meta: inventoryMeta(1, 10, 0) }));
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const status = url.searchParams.get("status");
    const filteredStatus = status === "DRAFT" || status === "PUBLISHED" ? status : undefined;
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(authorInventory(lastAuthUser.id, filteredStatus, page, 10)));
  }
  if (request.method === "GET" && url.pathname === "/posts/admin/inventory") {
    if (authMode === "unavailable") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (authMode === "revoke" || !lastAuthUser) return response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unauthorized" }));
    if (lastAuthUser.role.name !== "ADMIN") return response.writeHead(403, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Forbidden" }));
    if (inventoryMode === "error") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (inventoryMode === "forbidden") return response.writeHead(403, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Forbidden" }));
    if (inventoryMode === "empty") return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ data: [], meta: inventoryMeta(1, 10, 0) }));
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(adminInventory(page, 10)));
  }
  if (request.method === "GET" && url.pathname === "/tags" && !url.search && !request.headers.authorization) {
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(tags));
  }
  if (request.method === "GET" && url.pathname.startsWith("/posts/mine/")) {
    if (authMode === "unavailable") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (authMode === "revoke" || !lastAuthUser) return response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unauthorized" }));
    const id = decodeURIComponent(url.pathname.slice("/posts/mine/".length));
    ensureEditorSeed(lastAuthUser.id);
    const post = editorPosts.get(id);
    if (!post || (lastAuthUser.role.name !== "ADMIN" && post.authorId !== lastAuthUser.id)) return response.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Not found" }));
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(articleResponse(post)));
  }
  if (request.method === "POST" && url.pathname === "/posts") {
    if (authMode === "unavailable") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (authMode === "revoke" || !lastAuthUser) return response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unauthorized" }));
    if (lastAuthUser.role.name !== "AUTHOR" && lastAuthUser.role.name !== "ADMIN") return response.writeHead(403, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Forbidden" }));
    const body = await readJson(request);
    lastArticleWrite = { method: "POST", body };
    if (!body || typeof body.title !== "string" || !body.title.trim() || body.content !== undefined || !body.contentDocument || body.contentDocument.type !== "doc" || !Array.isArray(body.contentDocument.content)) return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Invalid write" }));
    const requestedCategories = Array.isArray(body.categoryIds) ? body.categoryIds : [];
    const requestedTags = Array.isArray(body.tagIds) ? body.tagIds : [];
    if ([...requestedCategories, ...requestedTags].some((id) => ![...categories, ...tags].some((item) => item.id === id))) return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Invalid taxonomy" }));
    const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    if (status === "PUBLISHED" && requestedCategories.length === 0) return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Category required" }));
    const id = `created-${editorPosts.size + 1}`;
    const post = editorPost(id, body.title.trim(), status, lastAuthUser.id, body.contentDocument, requestedCategories, requestedTags);
    editorPosts.set(id, post);
    return response.writeHead(201, { "Content-Type": "application/json" }).end(JSON.stringify(articleResponse(post)));
  }
  if (request.method === "PATCH" && url.pathname.startsWith("/posts/") && !url.pathname.startsWith("/posts/mine/") && !url.pathname.startsWith("/posts/admin/")) {
    if (authMode === "unavailable") return response.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unavailable" }));
    if (authMode === "revoke" || !lastAuthUser) return response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unauthorized" }));
    const id = decodeURIComponent(url.pathname.slice("/posts/".length));
    ensureEditorSeed(lastAuthUser.id);
    const post = editorPosts.get(id);
    if (!post || (lastAuthUser.role.name !== "ADMIN" && post.authorId !== lastAuthUser.id)) return response.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Not found" }));
    const body = await readJson(request);
    lastArticleWrite = { method: "PATCH", body };
    if (!body || (body.content !== undefined && body.contentDocument !== undefined)) return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Invalid write" }));
    if (body.content !== undefined && (typeof body.content !== "string" || !body.content.trim())) return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Invalid content" }));
    if (body.contentDocument !== undefined && (body.contentDocument.type !== "doc" || !Array.isArray(body.contentDocument.content))) return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Invalid document" }));
    const nextStatus = body.status === "PUBLISHED" ? "PUBLISHED" : body.status === "DRAFT" ? "DRAFT" : post.status;
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : post.categoryIds;
    if (nextStatus === "PUBLISHED" && categoryIds.length === 0) return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Category required" }));
    const updated = {
      ...post,
      ...(typeof body.title === "string" && body.title.trim() ? { title: body.title.trim() } : {}),
      ...(body.contentDocument !== undefined ? { contentDocument: body.contentDocument, content: "متن مقاله" } : {}),
      ...(typeof body.content === "string" ? { content: body.content, contentDocument: null } : {}),
      status: nextStatus,
      publishedAt: nextStatus === "DRAFT" ? null : post.publishedAt ?? "2026-01-02T10:00:00.000Z",
      ...(Array.isArray(body.categoryIds) ? { categoryIds } : {}),
      ...(Array.isArray(body.tagIds) ? { tagIds: body.tagIds } : {}),
    };
    editorPosts.set(id, updated);
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(articleResponse(updated)));
  }
  if (request.method === "POST" && url.pathname === "/__test/inventory") {
    const mode = url.searchParams.get("mode");
    if (!["success", "empty", "error", "forbidden"].includes(mode)) return response.writeHead(400).end();
    inventoryMode = mode;
    return response.writeHead(204).end();
  }
  if (request.method === "POST" && url.pathname === "/__test/articles" && url.searchParams.get("mode") === "reset") {
    editorPosts.clear();
    lastArticleWrite = null;
    return response.writeHead(204).end();
  }
  if (request.method === "GET" && url.pathname === "/__test/articles") {
    return response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(lastArticleWrite));
  }
  if (request.method === "POST" && url.pathname === "/__test/auth-mode") {
    const mode = url.searchParams.get("mode");
    if (!["normal", "revoke", "unavailable"].includes(mode)) return response.writeHead(400).end();
    authMode = mode;
    return response.writeHead(204).end();
  }
  if (request.method === "POST" && url.pathname === "/__test/session") {
    if (url.searchParams.get("mode") !== "clear") return response.writeHead(400).end();
    redis.clear();
    return response.writeHead(204).end();
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
  if (request.method === "POST" && url.pathname === "/__test/details") {
    const mode = url.searchParams.get("mode");
    if (!["success", "rich", "error", "rate-limit", "malformed", "invalid", "non-public", "disconnect", "timeout"].includes(mode)) return response.writeHead(400).end();
    detailMode = mode;
    return response.writeHead(204).end();
  }
  // Both test datasets share their list records with the detail response.
  if (request.method === "GET" && url.pathname.startsWith("/posts/") && !url.search && !request.headers.authorization) {
    let slug;
    try { slug = decodeURIComponent(url.pathname.slice("/posts/".length)); }
    catch { return response.writeHead(400).end(); }
    const post = [...publishedPosts, ...previewPosts, ...privatePosts].find((post) => post.slug === slug);
    if (!post || post.status !== "PUBLISHED") return response.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ statusCode: 404, message: "Post not found.", error: "Not Found" }));
    if (detailMode === "error") return response.writeHead(503).end("TEST DOUBLE: private detail failure");
    if (detailMode === "rate-limit") return response.writeHead(429).end();
    if (detailMode === "disconnect") return request.socket.destroy();
    if (detailMode === "timeout") return;
    response.writeHead(200, { "Content-Type": "application/json" });
    if (detailMode === "malformed") return response.end("{TEST DOUBLE");
    if (detailMode === "invalid") return response.end(JSON.stringify({ ...post, content: 5 }));
    if (detailMode === "non-public") return response.end(JSON.stringify({ ...post, status: "DRAFT", content: "PRIVATE TEST DOUBLE" }));
    if (detailMode === "rich") return response.end(JSON.stringify({
      ...post,
      coverImage: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        url: "https://res.cloudinary.com/demo/image/upload/v1/rich/cover.png",
        width: 800,
        height: 450,
        alt: "جلد مقاله",
      },
      content: "عنوان بخش\nمتن غنی",
      contentDocument: {
        type: "doc",
        attrs: { dir: "rtl" },
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "عنوان بخش" }] },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "متن پررنگ ", marks: [{ type: "bold" }] },
              { type: "text", text: "پیوند", marks: [{ type: "link", attrs: { href: "https://example.test/blank", target: "_blank" } }] },
              { type: "text", text: " " },
              { type: "text", text: "پیوند دوم", marks: [{ type: "link", attrs: { href: "https://example.test/same" } }] },
            ],
          },
          { type: "image", attrs: { mediaId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", alt: "تصویر متن" } },
          { type: "image", attrs: { mediaId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", alt: "تصویر گمشده" } },
          {
            type: "orderedList",
            attrs: { start: 2 },
            content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "مورد اول" }] }] }],
          },
          { type: "codeBlock", attrs: { language: "ts" }, content: [{ type: "text", text: "const x = 1;" }] },
        ],
      },
      contentMedia: [
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          url: "https://res.cloudinary.com/demo/image/upload/v1/rich/body.png",
          width: 400,
          height: 300,
        },
      ],
    }));
    return response.end(JSON.stringify(post));
  }
  if (request.method === "GET" && url.pathname === "/categories" && !url.search && !request.headers.authorization) {
    if (categoryMode === "error") return response.writeHead(503).end();
    response.writeHead(200, { "Content-Type": "application/json" });
    return response.end(JSON.stringify(categoryMode === "empty" ? [] : categoryMode === "invalid" ? [{ id: 1 }] : categories));
  }
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "10");
  const sort = url.searchParams.get("sort") ?? "newest";
  const search = url.searchParams.get("search");
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  if (
    request.method !== "GET" ||
    url.pathname !== "/posts" ||
    [...url.searchParams.keys()].some((key) => !["page", "limit", "sort", "search", "category", "tag"].includes(key) || url.searchParams.getAll(key).length !== 1) ||
    (!preview && ["page", "limit", "sort"].some((key) => !url.searchParams.has(key))) ||
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
  const source = postsMode === "empty" ? [] : preview ? previewPosts : publishedPosts;
  const posts = source.filter((post) =>
    post.status === "PUBLISHED" &&
    (!search || [post.title, post.content].some((text) => text.toLowerCase().includes(search.toLowerCase()))) &&
    (!category || post.categories.some((item) => item.slug === category)) &&
    (!tag || post.tags.some((item) => item.slug === tag)));
  // PostgreSQL defaults: NULLS FIRST for DESC, NULLS LAST for ASC; ties retain fixture order.
  const ordered = [...posts].sort((a, b) => {
    if (a.publishedAt === b.publishedAt) return 0;
    if (a.publishedAt === null) return sort === "newest" ? -1 : 1;
    if (b.publishedAt === null) return sort === "newest" ? 1 : -1;
    const difference = Date.parse(a.publishedAt) - Date.parse(b.publishedAt);
    return sort === "oldest" ? difference : -difference;
  });
  const body = JSON.stringify({
    data: ordered.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total: posts.length, totalPages: Math.ceil(posts.length / limit) },
  });
  if (postsMode === "slow") setTimeout(() => response.end(body), 2000);
  else response.end(body);
}).listen(4101, "127.0.0.1");
