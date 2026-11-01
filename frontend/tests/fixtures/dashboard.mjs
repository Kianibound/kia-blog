import { publishedPosts } from "./posts.mjs";

// Test doubles only. There is no authentication or production account here.
const identities = {
  USER: { name: "نرگس رضایی", username: "narges", role: "USER" },
  AUTHOR: { name: "سارا کیانی", username: "sara", role: "AUTHOR" },
  ADMIN: { name: "مدیر نمونه", username: "admin", role: "ADMIN" },
};
let role = "USER";
let mode = "success";
let author = "sara";
let postsMode = "success";
const authorIds = { sara: "10000000-0000-4000-8000-000000000002", nima: "10000000-0000-4000-8000-000000000001" };
// Reuse existing article records; MyPostsResponseDto has no nested relations.
const ownPosts = publishedPosts.map(({ author: omittedAuthor, categories: omittedCategories, tags: omittedTags, ...post }, index) => {
  void omittedAuthor; void omittedCategories; void omittedTags;
  const status = ["DRAFT", "PUBLISHED", "DEPRECATED"][index % 3];
  return { ...post, authorId: index === 11 ? authorIds.nima : authorIds.sara, status, publishedAt: status === "DRAFT" ? null : post.publishedAt };
});

export function handleDashboardFixture(request, response, url) {
  if (request.method === "POST" && url.pathname === "/__test/dashboard") {
    const nextRole = url.searchParams.get("role") ?? "USER";
    const nextMode = url.searchParams.get("mode") ?? "success";
    const nextAuthor = url.searchParams.get("author") ?? "sara";
    const nextPostsMode = url.searchParams.get("postsMode") ?? "success";
    if (!Object.hasOwn(identities, nextRole) || !Object.hasOwn(authorIds, nextAuthor) || !["success", "empty", "error", "invalid", "slow", "foreign"].includes(nextPostsMode) || !["success", "error", "invalid", "slow"].includes(nextMode)) {
      response.writeHead(400).end();
    } else {
      role = nextRole;
      mode = nextMode;
      author = nextAuthor;
      postsMode = nextPostsMode;
      response.writeHead(204).end();
    }
    return true;
  }
  if (request.method === "GET" && url.pathname === "/dashboard-posts") {
    const page = Number(url.searchParams.get("page"));
    const limit = Number(url.searchParams.get("limit"));
    if (role !== "AUTHOR") { response.writeHead(403).end(); return true; }
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50 || [...url.searchParams.keys()].some(key => !["page", "limit"].includes(key) || url.searchParams.getAll(key).length !== 1)) { response.writeHead(400).end(); return true; }
    if (postsMode === "error") { response.writeHead(503).end("TEST DOUBLE: own Posts unavailable"); return true; }
    const rows = postsMode === "empty" ? [] : ownPosts.filter(post => post.authorId === authorIds[author]).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const payload = { data: rows.slice((page - 1) * limit, page * limit), meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } };
    if (postsMode === "invalid") payload.meta.totalPages = -1;
    if (postsMode === "foreign") payload.data = ownPosts.filter(post => post.authorId !== authorIds[author]).slice(0, 1);
    const send = () => response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(payload));
    if (postsMode === "slow") setTimeout(send, 1500); else send();
    return true;
  }
  if (request.method !== "GET" || url.pathname !== "/dashboard-identity") return false;
  if (mode === "error") {
    response.writeHead(503).end("TEST DOUBLE: dashboard unavailable");
    return true;
  }
  const identity = role === "AUTHOR" ? { ...identities.AUTHOR, id: authorIds[author], ...(author === "nima" ? { username: "nima", name: "نیما کیانی" } : {}) } : { ...identities[role], id: role.toLowerCase() };
  const payload = mode === "invalid" ? { ...identity, role: "UNKNOWN" } : identity;
  const send = () => response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(payload));
  if (mode === "slow") setTimeout(send, 1500);
  else send();
  return true;
}
