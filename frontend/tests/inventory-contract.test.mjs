import assert from "node:assert/strict";
import test from "node:test";
import {
  inventoryHref,
  inventoryPage,
  inventoryPath,
  inventoryStatus,
  parseAdminInventory,
  parseAuthorInventory,
  parseOwnPosts,
} from "../src/lib/own-posts-contract.ts";

const authorId = "author-1";
const ownPost = {
  id: "post-1",
  title: "مقالهٔ من",
  slug: "my-post",
  content: "متن",
  status: "DRAFT",
  authorId,
  publishedAt: null,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-02T10:00:00.000Z",
};
const mine = (data, meta = { page: 1, limit: 10, total: data.length, totalPages: 1 }) => ({ data, meta });
const summary = (post = ownPost, author = { id: authorId, username: "sara", name: "سارا", avatarUrl: null }) => {
  const copy = { ...post };
  delete copy.content;
  return { ...copy, author };
};

test("inventory requests use the exact Nest endpoints and query fields", () => {
  assert.equal(inventoryPath("AUTHOR", 1), "/posts/mine?page=1&limit=10");
  assert.equal(inventoryPath("AUTHOR", 2, "DRAFT"), "/posts/mine?page=2&limit=10&status=DRAFT");
  assert.equal(inventoryPath("ADMIN", 3, "PUBLISHED"), "/posts/admin/inventory?page=3&limit=10");
  assert.ok(!inventoryPath("AUTHOR", 1).includes("author="));
  assert.ok(!inventoryPath("ADMIN", 1).includes("status="));
});

test("dashboard inventory links preserve pagination and AUTHOR-only status", () => {
  assert.equal(inventoryHref("AUTHOR", 1), "/dashboard/posts");
  assert.equal(inventoryHref("AUTHOR", 2, "DRAFT"), "/dashboard/posts?page=2&status=DRAFT");
  assert.equal(inventoryHref("ADMIN", 2, "DRAFT"), "/dashboard/posts?page=2");
});

test("page and status parsing rejects malformed values", () => {
  assert.equal(inventoryPage("2"), 2);
  assert.equal(inventoryPage("01"), 1);
  assert.equal(inventoryPage("0"), 1);
  assert.equal(inventoryPage("-1"), 1);
  assert.equal(inventoryPage(["2"]), 1);
  assert.equal(inventoryStatus("DRAFT"), "DRAFT");
  assert.equal(inventoryStatus("DEPRECATED"), null);
  assert.equal(inventoryStatus("PUBLISHED"), "PUBLISHED");
  assert.equal(inventoryStatus(undefined), undefined);
  assert.equal(inventoryStatus("deprecated"), null);
});

test("AUTHOR inventory accepts DEPRECATED but rejects foreign ownership", () => {
  const data = [ownPost, { ...ownPost, id: "post-2", status: "DEPRECATED" }];
  assert.deepEqual(parseAuthorInventory(mine(data), 1, 10, authorId).data.map((post) => post.status), ["DRAFT", "DEPRECATED"]);
  assert.throws(() => parseAuthorInventory(mine([{ ...ownPost, authorId: "other" }]), 1, 10, authorId), /owner/);
  assert.throws(() => parseOwnPosts(mine([{ ...ownPost, status: "UNKNOWN" }]), 1, 10), /Invalid own Post/);
  assert.throws(() => parseOwnPosts({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 2 } }, 1, 10), /pagination/);
});

test("ADMIN inventory preserves real summaries, IDs, statuses and pagination", () => {
  const data = [
    summary(),
    summary({ ...ownPost, id: "post-2", title: "مقالهٔ منتشرشده", status: "PUBLISHED", publishedAt: "2026-01-03T10:00:00.000Z" }, { id: authorId, username: "sara", name: null, avatarUrl: null }),
    summary({ ...ownPost, id: "post-3", title: "مقالهٔ قدیمی", status: "DEPRECATED" }),
  ];
  const parsed = parseAdminInventory({ data, meta: { page: 1, limit: 10, total: 12, totalPages: 2 } }, 1, 10);
  assert.deepEqual(parsed.data.map((post) => [post.id, post.status]), [["post-1", "DRAFT"], ["post-2", "PUBLISHED"], ["post-3", "DEPRECATED"]]);
  assert.deepEqual(parsed.data[0].author, { id: authorId, username: "sara", name: "سارا", avatarUrl: null });
  assert.deepEqual(parsed.meta, { page: 1, limit: 10, total: 12, totalPages: 2 });
});

test("ADMIN inventory rejects mismatched author identity and malformed records", () => {
  assert.throws(() => parseAdminInventory({ data: [summary(ownPost, { id: "other", username: "x", name: null, avatarUrl: null })], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }, 1, 10), /author/);
  assert.throws(() => parseAdminInventory({ data: [{ ...summary(), author: null }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }, 1, 10), /author/);
  assert.throws(() => parseAdminInventory({ data: [{ ...summary(), status: "ARCHIVED" }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }, 1, 10), /post/);
  assert.throws(() => parseAdminInventory({ data: [], meta: { page: 2, limit: 10, total: 12, totalPages: 1 } }, 2, 10), /pagination/);
});
