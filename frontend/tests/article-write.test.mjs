import assert from "node:assert/strict";
import test from "node:test";
import {
  articleDocument,
  articleWriteMethod,
  articleWritePath,
  buildArticleWritePayload,
  buildStatusPayload,
  mutationErrorResult,
  prepareArticleDocument,
  publicationFailureMessage,
  UnsupportedArticleImageError,
} from "../src/lib/article-write.ts";
import { CsrfError } from "../src/lib/session/errors.ts";
import {
  parseArticleDetail,
  parseArticleWrite,
} from "../src/lib/article-form-contract.ts";

const document = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "عنوان" }] },
    { type: "paragraph", content: [{ type: "text", text: "متن" }] },
  ],
};

function post(extra = {}) {
  return {
    id: "post-1",
    title: "مقاله",
    slug: "article",
    content: "متن",
    contentDocument: document,
    status: "DRAFT",
    authorId: "author-1",
    publishedAt: null,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
    coverImage: null,
    contentMedia: [],
    author: { id: "author-1", username: "sara", name: "سارا", avatarUrl: null },
    categories: [{ id: "cat-1", name: "دسته", slug: "cat", createdAt: "2026-01-01T10:00:00.000Z", updatedAt: "2026-01-01T10:00:00.000Z" }],
    tags: [{ id: "tag-1", name: "تگ", slug: "tag", createdAt: "2026-01-01T10:00:00.000Z", updatedAt: "2026-01-01T10:00:00.000Z" }],
    ...extra,
  };
}

test("canonical writes contain contentDocument and never legacy content", () => {
  const payload = buildArticleWritePayload({
    title: "  عنوان  ",
    document,
    categoryIds: ["cat-1"],
    tagIds: ["tag-1"],
  });
  assert.equal(payload.title, "عنوان");
  assert.deepEqual(payload.contentDocument, document);
  assert.equal("content" in payload, false);
  assert.equal(articleWritePath(undefined), "/posts");
  assert.equal(articleWritePath("post-1"), "/posts/post-1");
  assert.equal(articleWriteMethod(undefined), "POST");
  assert.equal(articleWriteMethod("post-1"), "PATCH");
  assert.deepEqual(buildStatusPayload("PUBLISHED"), { status: "PUBLISHED" });
  assert.throws(() => buildArticleWritePayload({ title: "x", document: { type: "text" }, categoryIds: [], tagIds: [] }), /document/);
  assert.throws(() => buildArticleWritePayload({ title: "x", document, categoryIds: ["a", "a"], tagIds: [] }), /Duplicate/);
});

test("legacy text and canonical documents round-trip without the preview envelope", () => {
  assert.deepEqual(articleDocument({ content: "خط اول\nخط دوم" }), {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "خط اول" }] },
      { type: "paragraph", content: [{ type: "text", text: "خط دوم" }] },
    ],
  });
  assert.deepEqual(articleDocument({ content: "ignored", contentDocument: document }), document);
  assert.equal(JSON.stringify(articleDocument({ content: "x" })).includes("tiptap-ui-proposal-1"), false);

  const legacy = buildArticleWritePayload({ title: "عنوان", content: "متن قدیمی", categoryIds: [], tagIds: [] });
  assert.equal(legacy.content, "متن قدیمی");
  assert.equal("contentDocument" in legacy, false);
});

test("canonical image media IDs are preserved and unsupported images fail closed", () => {
  const mediaId = "40000000-0000-4000-8000-000000000001";
  const payload = buildArticleWritePayload({
    title: "تصویر",
    document: {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { mediaId, alt: "تصویر متن", src: "https://example.test/temp.png" },
        },
      ],
    },
    categoryIds: [],
    tagIds: [],
  });
  assert.deepEqual(payload.contentDocument.content[0], {
    type: "image",
    attrs: { mediaId, alt: "تصویر متن" },
  });
  assert.throws(
    () =>
      buildArticleWritePayload({
        title: "تصویر",
        document: {
          type: "doc",
          content: [{ type: "image", attrs: { src: "https://example.test/temp.png" } }],
        },
        categoryIds: [],
        tagIds: [],
      }),
    UnsupportedArticleImageError,
  );
  assert.throws(
    () =>
      buildArticleWritePayload({
        title: "تصویر",
        document: {
          type: "doc",
          content: [{ type: "image", attrs: { mediaId: "not-a-uuid", alt: "تصویر" } }],
        },
        categoryIds: [],
        tagIds: [],
      }),
    UnsupportedArticleImageError,
  );
});

test("server-resolved contentMedia hydrates display src without changing identity", () => {
  const mediaId = "40000000-0000-4000-8000-000000000001";
  const contentDocument = {
    type: "doc",
    content: mediaId
      ? [{ type: "image", attrs: { mediaId, alt: "تصویر متن" } }]
      : [],
  };
  const prepared = prepareArticleDocument({
    contentDocument,
    contentMedia: [
      { id: mediaId, url: "https://res.cloudinary.com/demo/image/upload/v1/body.png", width: 400, height: 300 },
    ],
  });
  assert.deepEqual(prepared.content[0].attrs, {
    mediaId,
    alt: "تصویر متن",
    src: "https://res.cloudinary.com/demo/image/upload/v1/body.png",
  });
  assert.throws(
    () => prepareArticleDocument({ contentDocument, contentMedia: [] }),
    UnsupportedArticleImageError,
  );
});

test("cover media IDs and alt text use the exact Nest create/update fields", () => {
  const mediaId = "40000000-0000-4000-8000-000000000001";
  const withCover = buildArticleWritePayload({
    title: "جلد",
    document,
    categoryIds: [],
    tagIds: [],
    coverMediaId: mediaId,
    coverAlt: "جلد مقاله",
  });
  assert.equal(withCover.coverMediaId, mediaId);
  assert.equal(withCover.coverAlt, "جلد مقاله");
  const removed = buildArticleWritePayload({
    title: "جلد",
    document,
    categoryIds: [],
    tagIds: [],
    coverMediaId: null,
  });
  assert.equal(removed.coverMediaId, null);
  assert.equal("coverAlt" in removed, false);
  assert.throws(
    () => buildArticleWritePayload({ title: "جلد", document, categoryIds: [], tagIds: [], coverMediaId: "not-a-uuid", coverAlt: "x" }),
    /cover/,
  );
});

test("write and detail parsers preserve canonical content, IDs and taxonomy", () => {
  for (const parse of [parseArticleWrite, parseArticleDetail]) {
    const parsed = parse(post());
    assert.deepEqual(parsed.contentDocument, document);
    assert.equal(parsed.id, "post-1");
    assert.deepEqual(parsed.categories.map((item) => item.id), ["cat-1"]);
    assert.deepEqual(parsed.tags.map((item) => item.id), ["tag-1"]);
  }
  assert.equal(parseArticleWrite(post({ contentDocument: null })).contentDocument, null);
});

test("CSRF rejection is a definite error while other write failures stay uncertain", () => {
  assert.deepEqual(mutationErrorResult(new CsrfError(), "امنیتی"), {
    state: "error",
    message: "امنیتی",
  });
  assert.deepEqual(mutationErrorResult(new Error("network"), "امنیتی"), {
    state: "uncertain",
  });
  assert.equal(
    publicationFailureMessage({ state: "error", message: "امنیتی" }, "خطای عمومی"),
    "امنیتی",
  );
  assert.equal(
    publicationFailureMessage({ state: "uncertain", message: "نامشخص" }, "خطای عمومی"),
    "خطای عمومی",
  );
  assert.equal(
    publicationFailureMessage({ state: "error" }, "خطای عمومی"),
    "خطای عمومی",
  );
});
