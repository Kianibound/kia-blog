import assert from "node:assert/strict";
import test from "node:test";
import { parsePublishedPosts } from "../src/lib/posts-contract.ts";
import { feed } from "./fixtures/posts.mjs";

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
