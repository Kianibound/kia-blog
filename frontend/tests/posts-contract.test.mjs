import assert from "node:assert/strict";
import test from "node:test";
import { parsePublishedPost, parsePublishedPosts } from "../src/lib/posts-contract.ts";
import { feed } from "./fixtures/posts.mjs";
import { previewPosts } from "./fixtures/preview-posts.mjs";
import { parseOwnPosts, parseAdminPosts } from "../src/lib/own-posts-contract.ts";
import { validateAuthorInput } from "../src/lib/author-form-contract.ts";
import { parseModerationComments } from "../src/lib/comment-moderation-contract.ts";
import { parseFixtureAvatar } from "../src/lib/avatar-contract.ts";

test("avatar state accepts only null or a persistent fixture image reference", () => {
  assert.equal(parseFixtureAvatar({ src: null }), null);
  assert.equal(parseFixtureAvatar({ src: "/fixture-images/12345678-abcd" }), "/fixture-images/12345678-abcd");
  for (const src of ["blob:http://127.0.0.1/avatar", "data:image/png;base64,AAAA", "https://example.test/image.png", "/fixture-images/../secret", "", 3]) {
    assert.throws(() => parseFixtureAvatar({ src }));
  }
  assert.throws(() => parseFixtureAvatar({}));
});

test("fixture moderation accepts only identified pending or approved comments without article data", () => {
  const comment = { id: "comment-1", name: "نرگس رضایی", text: "دیدگاه خواننده", status: "PENDING" };
  assert.deepEqual(parseModerationComments([comment]), [comment]);
  assert.deepEqual(parseModerationComments([]), []);
  for (const invalid of [null, {}, [comment, comment], [{ ...comment, status: "REJECTED" }], [{ ...comment, text: " " }], [{ ...comment, name: null }], [{ ...comment, id: "" }]]) {
    assert.throws(() => parseModerationComments(invalid));
  }
});

test("ADMIN inventory validates authors against article ownership without dropping publication states", () => {
  const post = { ...feed.data[0], status: "DRAFT", publishedAt: null };
  const response = { data: [post], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
  const result = parseAdminPosts(response, 1, 10);
  assert.equal(result.data[0].author.id, post.authorId);
  assert.equal(result.data[0].status, "DRAFT");
  for (const author of [null, { ...post.author, id: "foreign" }, { ...post.author, name: 7 }, { ...post.author, username: "" }]) {
    assert.throws(() => parseAdminPosts({ ...response, data: [{ ...post, author }] }, 1, 10));
  }
});

test("Author creation requires a name and a well-formed email", () => {
  assert.deepEqual(validateAuthorInput({ name: "  ", email: "" }), { name: "required", email: "required" });
  for (const email of ["reader", "reader@", "reader@example", "reader @example.test", "a@@example.test"]) {
    assert.deepEqual(validateAuthorInput({ name: "نویسنده", email }), { email: "format" });
  }
  assert.deepEqual(validateAuthorInput({ name: " نویسنده ", email: " reader@example.test " }), {});
});

test("public cards preserve optional covers and reject unsafe cover references", () => {
  const cover = { src: "/fixture-images/12345678-abcd", alt: "تصویر جلد مقاله" };
  const withCover = { ...feed, data: [{ ...feed.data[0], coverImage: cover }] };
  assert.deepEqual(parsePublishedPosts(withCover).data[0].coverImage, cover);
  assert.equal(parsePublishedPosts(feed).data[0].coverImage, null);
  for (const invalid of [{ src: "javascript:alert(1)", alt: "تصویر" }, { src: cover.src, alt: " " }, "bad"]) {
    assert.throws(() => parsePublishedPosts({ ...feed, data: [{ ...feed.data[0], coverImage: invalid }] }));
  }
});

test("own-Post parsing preserves scalar records and rejects invalid status or pagination", () => {
  const { author, categories, tags, ...post } = feed.data[0];
  void author; void categories; void tags;
  const response = { data: [{ ...post, status: "DRAFT", publishedAt: null }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
  assert.deepEqual(parseOwnPosts(response, 1, 10), response);
  for (const invalid of [
    { ...response, data: [{ ...post, status: ["DRAFT"] }] },
    { ...response, data: [{ ...post, authorId: null }] },
    { ...response, data: [{ ...post, updatedAt: "not-a-date" }] },
    { ...response, meta: { ...response.meta, page: 2 } },
    { ...response, meta: { ...response.meta, totalPages: -1 } },
  ]) assert.throws(() => parseOwnPosts(invalid, 1, 10));
});

test("detail parsing preserves literal content and taxonomy slugs from all preview articles", () => {
  for (const record of previewPosts) {
    const detail = parsePublishedPost(record);
    assert.equal(detail.content, record.content);
    assert.equal(detail.id, record.id);
    assert.equal(detail.slug, record.slug);
    assert.deepEqual(detail.categories, record.categories);
    assert.deepEqual(detail.tags, record.tags);
  }
});

test("detail parsing rejects envelopes, non-public content and invalid consumed fields", () => {
  const post = previewPosts[0];
  for (const response of [feed, { ...post, status: "DRAFT" }, { ...post, status: "DEPRECATED" },
    { ...post, content: 5 }, { ...post, tags: null }, { ...post, categories: [{ id: "id", name: "name" }] }]) {
    assert.throws(() => parsePublishedPost(response), /Invalid public post response/);
  }
});

test("the public posts boundary preserves pagination metadata, identifiers, and slugs", () => {
  const result = parsePublishedPosts(feed);
  assert.deepEqual(result.meta, { page: 1, limit: 10, total: 12, totalPages: 2 });
  assert.equal(result.data[0].id, "00000000-0000-4000-8000-000000000001");
  assert.equal(result.data[0].slug, "test-post-1");
});

test("the public posts boundary rejects timestamps without a timezone", () => {
  const response = structuredClone(feed);
  response.data[0].publishedAt = "2026-03-20T21:00:00";
  assert.throws(() => parsePublishedPosts(response), /Invalid public posts response/);
});

test("incompatible or non-public responses are rejected instead of becoming an empty feed", () => {
  const invalidResponses = [
    { statusCode: 500, message: "TEST DOUBLE ERROR" },
    { ...feed, meta: { ...feed.meta, total: "10" } },
    { ...feed, data: [{ ...feed.data[0], status: "DRAFT" }] },
    { ...feed, data: [{ ...feed.data[0], author: null }] },
    { ...feed, data: [{ ...feed.data[0], categories: null }] },
  ];
  for (const response of invalidResponses) {
    assert.throws(() => parsePublishedPosts(response), /Invalid public posts response/);
  }
});
