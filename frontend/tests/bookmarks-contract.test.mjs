import assert from "node:assert/strict";
import test from "node:test";
import { bookmarkFailure, parseBookmarks } from "../src/lib/bookmarks-contract.ts";

const post = {
  id: "10000000-0000-4000-8000-000000000001",
  title: "مقالهٔ ذخیره‌شده",
  slug: "saved-post",
  content: "متن",
  status: "PUBLISHED",
  publishedAt: "2026-03-01T10:00:00.000Z",
  coverImage: null,
  author: { id: "a-1", username: "nima", name: "نیما", avatarUrl: null },
  categories: [{ id: "c-1", name: "وب", slug: "web" }],
  tags: [],
};

const bookmark = {
  id: "b-1",
  userId: "90000000-0000-4000-8000-000000000001",
  postId: post.id,
  createdAt: "2026-03-02T10:00:00.000Z",
  post,
};

test("bookmarks project to card posts and ignore the owning userId", () => {
  assert.deepEqual(parseBookmarks([bookmark]), [
    {
      id: "b-1",
      postId: post.id,
      createdAt: "2026-03-02T10:00:00.000Z",
      post: {
        id: post.id,
        title: "مقالهٔ ذخیره‌شده",
        slug: "saved-post",
        publishedAt: "2026-03-01T10:00:00.000Z",
        authorName: "نیما",
        categories: [{ id: "c-1", name: "وب" }],
        coverImage: null,
      },
    },
  ]);
  assert.deepEqual(parseBookmarks([]), []);
});

test("unpublished or inconsistent bookmark rows are rejected, never linked", () => {
  assert.equal(parseBookmarks([{ ...bookmark, post: { ...post, status: "DRAFT" } }]), null);
  assert.equal(parseBookmarks([{ ...bookmark, postId: "other" }]), null);
  assert.equal(parseBookmarks([{ ...bookmark, post: { ...post, author: null } }]), null);
  assert.equal(parseBookmarks([{ ...bookmark, post: { ...post, categories: [{ id: 1 }] } }]), null);
  assert.equal(parseBookmarks({ data: [bookmark] }), null);
});

test("bookmark writes classify auth expiry and missing posts distinctly", () => {
  assert.equal(bookmarkFailure(401), "unauthorized");
  assert.equal(bookmarkFailure(403), "forbidden");
  assert.equal(bookmarkFailure(404), "not-found");
  assert.equal(bookmarkFailure(400), "validation");
  assert.equal(bookmarkFailure(422), "validation");
  assert.equal(bookmarkFailure(503), "unavailable");
  assert.equal(bookmarkFailure(418), "protocol");
});
