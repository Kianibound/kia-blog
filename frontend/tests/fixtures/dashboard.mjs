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
function postAuthor(post) {
  const username = post.authorId === authorIds.nima ? "nima" : "sara";
  return { id: post.authorId, name: username === "nima" ? "نیما کیانی" : identities.AUTHOR.name, username, avatarUrl: null };
}
// Reuse existing article records; MyPostsResponseDto has no nested relations.
const initialPosts = publishedPosts.map(({ author: omittedAuthor, ...post }, index) => {
  void omittedAuthor;
  const status = ["DRAFT", "PUBLISHED", "DEPRECATED"][index % 3];
  return { ...post, authorId: index === 11 ? authorIds.nima : authorIds.sara, status, publishedAt: status === "DRAFT" ? null : post.publishedAt };
});
let ownPosts = structuredClone(initialPosts);
let saveMode = "success";
let formMode = "success";
let authors = []; // Test-only Authors; retained until an explicit fixture reset.
// Minimal moderation test doubles; intentionally no article or reply associations.
const initialComments = [
  { id: "60000000-0000-4000-8000-000000000001", name: "نرگس رضایی", text: "این دیدگاه در انتظار بررسی است.", status: "PENDING" },
  // Unbroken user text is intentional: exercise wrapping without adding a fixture mode.
  { id: "60000000-0000-4000-8000-000000000002", name: "سارا کیانی", text: `این دیدگاه قبلاً تأیید شده است. ${"متنبدونفاصله".repeat(20)}`, status: "APPROVED" },
];
let comments = structuredClone(initialComments);
let commentsMode = "success";
let writes = 0;
let imageMode = "success";
const images = new Map(); // Selected bytes live only in this resettable test process.
function validImages(node) {
  return node && typeof node === "object" && (node.type !== "image" || (typeof node.attrs?.alt === "string" && node.attrs.alt.trim() && images.has(node.attrs?.src))) && (!node.content || (Array.isArray(node.content) && node.content.every(validImages)));
}
const scalar = ({ categories, tags, previewDocument, ...post }) => { void categories; void tags; void previewDocument; return post; };
const json = (response, status, payload) => response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(payload));
const fullTaxonomy = item => ({ ...item, createdAt: "2026-03-19T12:00:00.000Z", updatedAt: "2026-03-19T12:00:00.000Z" });
function writeResponse(request, response, post, status = 200) {
  if (saveMode === "uncertain") { request.socket.destroy(); return; }
  const send = () => json(response, status, { ...post, categories: post.categories.map(fullTaxonomy), tags: post.tags.map(fullTaxonomy) });
  if (saveMode === "slow") setTimeout(send, 1500); else send();
}

export function handleDashboardFixture(request, response, url, categoryChoices) {
  if (request.method === "POST" && url.pathname === "/__test/dashboard") {
    const nextRole = url.searchParams.get("role") ?? "USER";
    const nextMode = url.searchParams.get("mode") ?? "success";
    const nextAuthor = url.searchParams.get("author") ?? "sara";
    const nextPostsMode = url.searchParams.get("postsMode") ?? "success";
    const nextSaveMode = url.searchParams.get("saveMode") ?? "success";
    const nextFormMode = url.searchParams.get("formMode") ?? "success";
    const nextImageMode = url.searchParams.get("imageMode") ?? "success";
    const nextCommentsMode = url.searchParams.get("commentsMode") ?? "success";
    if (!["success", "empty", "error", "invalid", "slow"].includes(nextCommentsMode)) { response.writeHead(400).end(); return true; }
    if (!["success", "error", "slow"].includes(nextImageMode)) { response.writeHead(400).end(); return true; }
    if (!Object.hasOwn(identities, nextRole) || !Object.hasOwn(authorIds, nextAuthor) || !["success", "empty", "error", "invalid", "slow", "foreign"].includes(nextPostsMode) || !["success", "error", "invalid", "slow"].includes(nextMode) || !["success", "error", "slow", "uncertain"].includes(nextSaveMode) || !["success", "missing", "error", "invalid", "detail-error"].includes(nextFormMode)) {
      response.writeHead(400).end();
    } else {
      role = nextRole;
      mode = nextMode;
      author = nextAuthor;
      postsMode = nextPostsMode;
      saveMode = nextSaveMode;
      formMode = nextFormMode;
      imageMode = nextImageMode;
      commentsMode = nextCommentsMode;
      if (url.searchParams.get("reset") === "1") { ownPosts = structuredClone(initialPosts); authors = []; comments = structuredClone(initialComments); writes = 0; images.clear(); }
      response.writeHead(204).end();
    }
    return true;
  }
  const authorMatch = /^\/dashboard-authors\/([^/]+)$/.exec(url.pathname);
  const commentMatch = /^\/dashboard-comments\/([^/]+)$/.exec(url.pathname);
  if (url.pathname === "/dashboard-comments" || commentMatch) {
    if (role !== "ADMIN") { response.writeHead(403).end(); return true; }
    if (!commentMatch && request.method === "GET") {
      if (commentsMode === "error") { response.writeHead(503).end(); return true; }
      const data = commentsMode === "empty" ? [] : commentsMode === "invalid" ? [{ ...initialComments[0], status: "UNKNOWN" }] : comments;
      const send = () => json(response, 200, data);
      if (commentsMode === "slow") setTimeout(send, 1500); else send();
      return true;
    }
    if (!commentMatch || !["DELETE", "PATCH"].includes(request.method)) { response.writeHead(405).end(); return true; }
    const index = comments.findIndex(item => item.id === commentMatch[1]);
    if (index === -1) { response.writeHead(404).end(); return true; }
    const finish = () => {
      if (saveMode === "uncertain") { request.socket.destroy(); return; }
      const send = () => response.writeHead(204).end();
      if (saveMode === "slow") setTimeout(send, 1500); else send();
    };
    if (request.method === "DELETE") {
      if (saveMode === "error") { response.writeHead(422).end(); return true; }
      comments.splice(index, 1);
      finish();
      return true;
    }
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", () => {
      let input;
      try { input = JSON.parse(body); } catch { response.writeHead(400).end(); return; }
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== 1 || input.status !== "APPROVED") { response.writeHead(400).end(); return; }
      if (comments[index].status !== "PENDING") { response.writeHead(409).end(); return; }
      if (saveMode === "error") { response.writeHead(422).end(); return; }
      comments[index] = { ...comments[index], status: "APPROVED" };
      finish();
    });
    return true;
  }
  if (authorMatch) {
    if (role !== "ADMIN") { response.writeHead(403).end(); return true; }
    if (request.method !== "DELETE") { response.writeHead(405).end(); return true; }
    const index = authors.findIndex(item => item.id === authorMatch[1]);
    if (index === -1) { response.writeHead(404).end(); return true; }
    if (saveMode === "error") { response.writeHead(422).end(); return true; }
    authors.splice(index, 1); // Only this test list changes; related fixture content is untouched.
    if (saveMode === "uncertain") { request.socket.destroy(); return true; }
    const send = () => response.writeHead(204).end();
    if (saveMode === "slow") setTimeout(send, 1500); else send();
    return true;
  }
  if (url.pathname === "/dashboard-authors") {
    if (role !== "ADMIN") { response.writeHead(403).end(); return true; }
    if (request.method === "GET") { json(response, 200, authors); return true; }
    if (request.method !== "POST") { response.writeHead(405).end(); return true; }
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", () => {
      let input;
      try { input = JSON.parse(body); } catch { response.writeHead(400).end(); return; }
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(key => !["name", "email"].includes(key)) || typeof input.name !== "string" || !input.name.trim() || typeof input.email !== "string" || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(input.email.trim())) { response.writeHead(400).end(); return; }
      if (authors.some(item => item.email.toLowerCase() === input.email.trim().toLowerCase())) { response.writeHead(409).end(); return; }
      if (saveMode === "error") { response.writeHead(422).end(); return; }
      const saved = { id: randomUUID(), name: input.name.trim(), email: input.email.trim(), role: "AUTHOR" };
      authors.unshift(saved);
      if (saveMode === "uncertain") { request.socket.destroy(); return; }
      const send = () => json(response, 201, saved);
      if (saveMode === "slow") setTimeout(send, 1500); else send();
    });
    return true;
  }
  if (request.method === "POST" && url.pathname === "/fixture-images") {
    if (role !== "AUTHOR" && role !== "ADMIN") { response.writeHead(403).end(); return true; }
    const type = request.headers["content-type"];
    if (!["image/png", "image/jpeg", "image/webp"].includes(type)) { response.writeHead(415).end(); return true; }
    const chunks = [];
    let size = 0;
    request.on("data", chunk => {
      size += chunk.length;
      if (size <= 5 * 1024 * 1024) chunks.push(chunk);
    });
    request.on("end", () => {
      if (!size || size > 5 * 1024 * 1024) { response.writeHead(413).end(); return; }
      if (imageMode === "error") { response.writeHead(503).end(); return; }
      const send = () => {
        const src = `/fixture-images/${randomUUID()}`;
        images.set(src, { type, bytes: Buffer.concat(chunks) });
        json(response, 201, { src });
      };
      if (imageMode === "slow") setTimeout(send, 1500); else send();
    });
    return true;
  }
  if (request.method === "GET" && url.pathname.startsWith("/fixture-images/")) {
    const image = images.get(url.pathname);
    if (image) response.writeHead(200, { "Content-Type": image.type, "Cache-Control": "no-store" }).end(image.bytes);
    else response.writeHead(404).end();
    return true;
  }
  const tags = [...new Map(publishedPosts.flatMap(post => post.tags).map(item => [item.id, fullTaxonomy(item)])).values()];
  // Test-host reading only: never used by the production public Posts adapter.
  if (request.method === "GET" && (url.pathname === "/dashboard-public-posts" || url.pathname.startsWith("/dashboard-public-posts/"))) {
    const rows = ownPosts.filter(post => post.status === "PUBLISHED");
    if (url.pathname === "/dashboard-public-posts") json(response, 200, rows.map(scalar));
    else {
      let slug;
      try { slug = decodeURIComponent(url.pathname.slice("/dashboard-public-posts/".length)); }
      catch { response.writeHead(400).end(); return true; }
      const post = rows.find(post => post.slug === slug);
      if (post) json(response, 200, { ...scalar(post), ...(post.previewDocument ? { previewDocument: post.previewDocument } : {}) }); else response.writeHead(404).end();
    }
    return true;
  }
  if (request.method === "GET" && url.pathname === "/__test/dashboard-writes") { json(response, 200, { writes }); return true; }
  if (url.pathname === "/dashboard-taxonomy" && request.method === "GET") {
    if (role !== "AUTHOR" && role !== "ADMIN") response.writeHead(403).end();
    else if (formMode === "error") response.writeHead(503).end();
    else json(response, 200, formMode === "invalid" ? { categories: null, tags: [] } : { categories: formMode === "missing" ? [] : categoryChoices, tags: formMode === "missing" ? [] : tags });
    return true;
  }
  const match = /^\/dashboard-posts\/([^/]+)$/.exec(url.pathname);
  if (match || (request.method === "POST" && url.pathname === "/dashboard-posts")) {
    if ((role !== "AUTHOR" && role !== "ADMIN") || (role === "ADMIN" && !match)) { response.writeHead(403).end(); return true; }
    const post = match ? ownPosts.find(item => item.id === match[1] && (role === "ADMIN" || item.authorId === authorIds[author])) : undefined;
    if (match && !post) { response.writeHead(404).end(); return true; }
    if (request.method === "DELETE") {
      if (role !== "ADMIN") { response.writeHead(403).end(); return true; }
      if (saveMode === "error") { response.writeHead(422).end(); return true; }
      ownPosts.splice(ownPosts.indexOf(post), 1);
      if (saveMode === "uncertain") { request.socket.destroy(); return true; }
      const send = () => response.writeHead(204).end();
      if (saveMode === "slow") setTimeout(send, 1500); else send();
      return true;
    }
    if (request.method === "GET") {
      if (formMode === "detail-error") response.writeHead(503).end();
      else {
        const summary = ({ id, name, slug }) => ({ id, name, slug });
        json(response, 200, { ...post, categories: post.categories.map(summary), tags: post.tags.map(summary), author: postAuthor(post) });
      }
      return true;
    }
    if (!["POST", "PATCH"].includes(request.method) || (match && request.method !== "PATCH")) { response.writeHead(405).end(); return true; }
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", () => {
      let input;
      try { input = JSON.parse(body); } catch { response.writeHead(400).end(); return; }
      if (post && request.method === "PATCH" && input && typeof input === "object" && !Array.isArray(input) && Object.keys(input).length === 1 && ["DRAFT", "PUBLISHED"].includes(input.status)) {
        // UI category checks are feedback only. The test double adds no category enforcement.
        writes++;
        if (saveMode === "error") { response.writeHead(422).end(); return; }
        const now = new Date().toISOString();
        const publishedAt = input.status === "DRAFT" ? null : post.status === "PUBLISHED" ? post.publishedAt : now;
        const saved = { ...post, status: input.status, publishedAt, updatedAt: now };
        ownPosts[ownPosts.indexOf(post)] = saved;
        writeResponse(request, response, saved);
        return;
      }
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(key => !["title", "content", "categoryIds", "tagIds", "previewDocument", "coverImage"].includes(key)) || typeof input.title !== "string" || !input.title.trim() || typeof input.content !== "string" || !input.content.trim() || !Array.isArray(input.categoryIds) || !Array.isArray(input.tagIds)) { response.writeHead(400).end(); return; }
      if (input.coverImage != null && (typeof input.coverImage !== "object" || typeof input.coverImage.alt !== "string" || !input.coverImage.alt.trim() || !images.has(input.coverImage.src))) { response.writeHead(400).end(); return; }
      // Envelope check for UI review only, not canonical rich-content validation.
      if (input.previewDocument !== undefined && (input.previewDocument?.format !== "tiptap-ui-proposal-1" || input.previewDocument?.document?.type !== "doc" || !Array.isArray(input.previewDocument?.document?.content))) { response.writeHead(400).end(); return; }
      if (input.previewDocument && !validImages(input.previewDocument.document)) { response.writeHead(400).end(); return; }
      const categories = [...categoryChoices, ...ownPosts.flatMap(item => item.categories).map(fullTaxonomy)];
      if (input.categoryIds.some(id => !categories.some(item => item.id === id)) || input.tagIds.some(id => !tags.some(item => item.id === id))) { response.writeHead(400).end(); return; }
      writes++;
      if (saveMode === "error") { response.writeHead(422).end(); return; }
      const now = new Date().toISOString();
      const saved = { ...(post ?? { id: randomUUID(), slug: `fixture-draft-${randomUUID()}`, authorId: authorIds[author], status: "DRAFT", publishedAt: null, createdAt: now }), title: input.title, content: input.content, updatedAt: now, categories: [...new Set(input.categoryIds)].map(id => categories.find(item => item.id === id)), tags: [...new Set(input.tagIds)].map(id => tags.find(item => item.id === id)) };
      saved.coverImage = input.coverImage === undefined ? (post?.coverImage ?? null) : input.coverImage;
      if (input.previewDocument !== undefined) saved.previewDocument = input.previewDocument;
      if (post) ownPosts[ownPosts.indexOf(post)] = saved; else ownPosts.unshift(saved);
      writeResponse(request, response, saved, post ? 200 : 201);
    });
    return true;
  }
  if (request.method === "GET" && url.pathname === "/dashboard-posts") {
    const page = Number(url.searchParams.get("page"));
    const limit = Number(url.searchParams.get("limit"));
    const status = url.searchParams.get("status");
    if (role !== "AUTHOR" && role !== "ADMIN") { response.writeHead(403).end(); return true; }
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50 || (status !== null && !["DRAFT", "PUBLISHED"].includes(status)) || [...url.searchParams.keys()].some(key => !["page", "limit", "status"].includes(key) || url.searchParams.getAll(key).length !== 1)) { response.writeHead(400).end(); return true; }
    if (postsMode === "error") { response.writeHead(503).end("TEST DOUBLE: own Posts unavailable"); return true; }
    const rows = postsMode === "empty" ? [] : ownPosts.filter(post => (role === "ADMIN" || post.authorId === authorIds[author]) && (!status || post.status === status)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const payload = { data: rows.slice((page - 1) * limit, page * limit).map(post => ({ ...scalar(post), ...(role === "ADMIN" ? { author: postAuthor(post) } : {}) })), meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } };
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
