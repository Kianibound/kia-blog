import assert from "node:assert/strict";
import test from "node:test";
import { parsePublishedPost, parsePublishedPosts } from "../src/lib/posts-contract.ts";
import { feed } from "./fixtures/posts.mjs";
import { previewPosts } from "./fixtures/preview-posts.mjs";

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
