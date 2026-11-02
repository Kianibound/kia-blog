import { publishedPosts } from "./posts.mjs";
import { randomUUID } from "node:crypto";

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
const initialPosts = publishedPosts.map(({ author: omittedAuthor, ...post }, index) => {
  void omittedAuthor;
  const status = ["DRAFT", "PUBLISHED", "DEPRECATED"][index % 3];
  return { ...post, authorId: index === 11 ? authorIds.nima : authorIds.sara, status, publishedAt: status === "DRAFT" ? null : post.publishedAt };
});
let ownPosts = structuredClone(initialPosts);
let saveMode = "success";
let formMode = "success";
let writes = 0;
const scalar = ({ categories, tags, previewDocument, ...post }) => { void categories; void tags; void previewDocument; return post; };
const json = (response, status, payload) => response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(payload));
const fullTaxonomy = item => ({ ...item, createdAt: "2026-03-19T12:00:00.000Z", updatedAt: "2026-03-19T12:00:00.000Z" });

export function handleDashboardFixture(request, response, url, categoryChoices) {
  if (request.method === "POST" && url.pathname === "/__test/dashboard") {
    const nextRole = url.searchParams.get("role") ?? "USER";
    const nextMode = url.searchParams.get("mode") ?? "success";
    const nextAuthor = url.searchParams.get("author") ?? "sara";
    const nextPostsMode = url.searchParams.get("postsMode") ?? "success";
    const nextSaveMode = url.searchParams.get("saveMode") ?? "success";
    const nextFormMode = url.searchParams.get("formMode") ?? "success";
    if (!Object.hasOwn(identities, nextRole) || !Object.hasOwn(authorIds, nextAuthor) || !["success", "empty", "error", "invalid", "slow", "foreign"].includes(nextPostsMode) || !["success", "error", "invalid", "slow"].includes(nextMode) || !["success", "error", "slow", "uncertain"].includes(nextSaveMode) || !["success", "missing", "error", "invalid", "detail-error"].includes(nextFormMode)) {
      response.writeHead(400).end();
    } else {
      role = nextRole;
      mode = nextMode;
      author = nextAuthor;
      postsMode = nextPostsMode;
      saveMode = nextSaveMode;
      formMode = nextFormMode;
      if (url.searchParams.get("reset") === "1") { ownPosts = structuredClone(initialPosts); writes = 0; }
      response.writeHead(204).end();
    }
    return true;
  }
  const tags = [...new Map(publishedPosts.flatMap(post => post.tags).map(item => [item.id, fullTaxonomy(item)])).values()];
  if (request.method === "GET" && url.pathname === "/__test/dashboard-writes") { json(response, 200, { writes }); return true; }
  if (url.pathname === "/dashboard-taxonomy" && request.method === "GET") {
    if (role !== "AUTHOR") response.writeHead(403).end();
    else if (formMode === "error") response.writeHead(503).end();
    else json(response, 200, formMode === "invalid" ? { categories: null, tags: [] } : { categories: formMode === "missing" ? [] : categoryChoices, tags: formMode === "missing" ? [] : tags });
    return true;
  }
  const match = /^\/dashboard-posts\/([^/]+)$/.exec(url.pathname);
  if (match || (request.method === "POST" && url.pathname === "/dashboard-posts")) {
    if (role !== "AUTHOR") { response.writeHead(403).end(); return true; }
    const post = match ? ownPosts.find(item => item.id === match[1] && item.authorId === authorIds[author]) : undefined;
    if (match && !post) { response.writeHead(404).end(); return true; }
    if (request.method === "GET") {
      if (formMode === "detail-error") response.writeHead(503).end();
      else {
        const summary = ({ id, name, slug }) => ({ id, name, slug });
        json(response, 200, { ...post, categories: post.categories.map(summary), tags: post.tags.map(summary), author: { id: post.authorId, name: author === "sara" ? identities.AUTHOR.name : "نیما کیانی", username: author, avatarUrl: null } });
      }
      return true;
    }
    if (!["POST", "PATCH"].includes(request.method) || (match && request.method !== "PATCH")) { response.writeHead(405).end(); return true; }
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", () => {
      let input;
      try { input = JSON.parse(body); } catch { response.writeHead(400).end(); return; }
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(key => !["title", "content", "categoryIds", "tagIds", "previewDocument"].includes(key)) || typeof input.title !== "string" || !input.title.trim() || typeof input.content !== "string" || !input.content.trim() || !Array.isArray(input.categoryIds) || !Array.isArray(input.tagIds)) { response.writeHead(400).end(); return; }
      // Envelope check for UI review only, not canonical rich-content validation.
      if (input.previewDocument !== undefined && (input.previewDocument?.format !== "tiptap-ui-proposal-1" || input.previewDocument?.document?.type !== "doc" || !Array.isArray(input.previewDocument?.document?.content))) { response.writeHead(400).end(); return; }
      const categories = [...categoryChoices, ...ownPosts.flatMap(item => item.categories).map(fullTaxonomy)];
      if (input.categoryIds.some(id => !categories.some(item => item.id === id)) || input.tagIds.some(id => !tags.some(item => item.id === id))) { response.writeHead(400).end(); return; }
      writes++;
      if (saveMode === "error") { response.writeHead(422).end(); return; }
      const now = new Date().toISOString();
      const saved = { ...(post ?? { id: randomUUID(), slug: `fixture-draft-${randomUUID()}`, authorId: authorIds[author], status: "DRAFT", publishedAt: null, createdAt: now }), title: input.title, content: input.content, updatedAt: now, categories: [...new Set(input.categoryIds)].map(id => categories.find(item => item.id === id)), tags: [...new Set(input.tagIds)].map(id => tags.find(item => item.id === id)) };
      if (input.previewDocument !== undefined) saved.previewDocument = input.previewDocument;
      if (post) ownPosts[ownPosts.indexOf(post)] = saved; else ownPosts.unshift(saved);
      if (saveMode === "uncertain") { request.socket.destroy(); return; }
      const send = () => json(response, post ? 200 : 201, { ...saved, categories: saved.categories.map(fullTaxonomy), tags: saved.tags.map(fullTaxonomy) });
      if (saveMode === "slow") setTimeout(send, 1500); else send();
    });
    return true;
  }
  if (request.method === "GET" && url.pathname === "/dashboard-posts") {
    const page = Number(url.searchParams.get("page"));
    const limit = Number(url.searchParams.get("limit"));
    if (role !== "AUTHOR") { response.writeHead(403).end(); return true; }
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50 || [...url.searchParams.keys()].some(key => !["page", "limit"].includes(key) || url.searchParams.getAll(key).length !== 1)) { response.writeHead(400).end(); return true; }
    if (postsMode === "error") { response.writeHead(503).end("TEST DOUBLE: own Posts unavailable"); return true; }
    const rows = postsMode === "empty" ? [] : ownPosts.filter(post => post.authorId === authorIds[author]).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const payload = { data: rows.slice((page - 1) * limit, page * limit).map(scalar), meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } };
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
