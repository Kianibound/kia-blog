import assert from "node:assert/strict";
import test from "node:test";
import {
  authorHref,
  categoryHref,
  isSafeAuthorUsername,
  isSafeTaxonomySlug,
  normalizeSearchState,
  pagedHref,
  tagHref,
} from "../src/lib/discovery.ts";
import { postsQueryParams } from "../src/lib/posts-query.ts";

test("only routable ASCII slugs and usernames become public paths", () => {
  assert.equal(isSafeTaxonomySlug("web"), true);
  assert.equal(isSafeTaxonomySlug("web-dev-2"), true);
  assert.equal(isSafeTaxonomySlug(""), false);
  assert.equal(isSafeTaxonomySlug("Web"), false);
  assert.equal(isSafeTaxonomySlug("../admin"), false);
  assert.equal(isSafeTaxonomySlug("یادگیری"), false);

  assert.equal(isSafeAuthorUsername("nima"), true);
  assert.equal(isSafeAuthorUsername("user_ab12"), true);
  assert.equal(isSafeAuthorUsername("a b"), false);
  assert.equal(isSafeAuthorUsername("../x"), false);
  assert.equal(isSafeAuthorUsername("a".repeat(65)), false);
});

test("canonical hrefs are encoded and never accept a caller host", () => {
  assert.equal(categoryHref("web"), "/categories/web");
  assert.equal(tagHref("web"), "/tags/web");
  assert.equal(authorHref("user_ab"), "/authors/user_ab");
  assert.equal(categoryHref("a b"), "/categories/a%20b");
});

test("search query handling trims, bounds and normalizes page/sort", () => {
  assert.deepEqual(normalizeSearchState({}), { q: undefined, page: 1, sort: "newest" });
  assert.deepEqual(normalizeSearchState({ q: "  متن  ", page: "2", sort: "oldest" }), {
    q: "متن",
    page: 2,
    sort: "oldest",
  });
  assert.deepEqual(normalizeSearchState({ q: "x".repeat(300) }).q?.length, 200);
  assert.equal(normalizeSearchState({ page: "-1" }).page, 1);
  assert.equal(normalizeSearchState({ page: "1.5" }).page, 1);
  assert.equal(normalizeSearchState({ sort: "sideways" }).sort, "newest");
});

test("pagination hrefs keep only meaningful params", () => {
  assert.equal(pagedHref("/search", { page: 1, sort: "newest" }), "/search");
  assert.equal(pagedHref("/search", { page: 1, sort: "newest", q: "متن" }), "/search?q=%D9%85%D8%AA%D9%86");
  assert.equal(pagedHref("/search", { page: 2, sort: "oldest", q: "a b" }), "/search?q=a+b&sort=oldest&page=2");
  assert.equal(pagedHref("/categories/web", { page: 3, sort: "oldest" }), "/categories/web?sort=oldest&page=3");
  assert.equal(pagedHref("/authors/nima", { page: 1, sort: "newest" }), "/authors/nima");
});

test("author filtering is sent to the live posts endpoint", () => {
  const params = postsQueryParams({ page: 1, sort: "newest", author: "nima" });
  assert.equal(params.get("author"), "nima");
});
