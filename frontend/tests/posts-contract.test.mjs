import assert from "node:assert/strict";
import test from "node:test";
import { parseBookmarkState, parseBookmarkedPosts, parsePublishedPost, parsePublishedPosts, buildRichBlocks, parseContentMedia, parseRichDocument } from "../src/lib/posts-contract.ts";
import { feed } from "./fixtures/posts.mjs";
import { previewPosts } from "./fixtures/preview-posts.mjs";
import { parseOwnPosts, parseAdminPosts } from "../src/lib/own-posts-contract.ts";
import { validateAuthorInput } from "../src/lib/author-form-contract.ts";
import { parseApprovedComments, parseModerationComments, parseOwnComments, validateArticleCommentText } from "../src/lib/comment-moderation-contract.ts";
import { parseFixtureAvatar } from "../src/lib/avatar-contract.ts";
import { validatePasswordCharacters, validateRegistrationPasswords } from "../src/lib/registration-validation.ts";

test("bookmark fixture responses validate USER ownership, selected article and published-only unique cards", () => {
  assert.equal(parseBookmarkState({ userId: "user", slug: "test-post-1", saved: true }, "user", "test-post-1"), true);
  assert.equal(parseBookmarkState({ userId: "user", slug: "test-post-1", saved: false }, "user", "test-post-1"), false);
  for (const value of [null, { userId: "other", slug: "test-post-1", saved: true }, { userId: "user", slug: "other", saved: true }, { userId: "user", slug: "test-post-1", saved: "true" }]) assert.throws(() => parseBookmarkState(value, "user", "test-post-1"));
  const payload = { userId: "user", data: [feed.data[0]] };
  assert.equal(parseBookmarkedPosts(payload, "user")[0].slug, "test-post-1");
  assert.deepEqual(parseBookmarkedPosts({ userId: "user", data: [] }, "user"), []);
  for (const value of [{ ...payload, userId: "other" }, { ...payload, data: [feed.data[0], feed.data[0]] }, { ...payload, data: [{ ...feed.data[0], status: "DRAFT" }] }, { ...payload, data: [{ ...feed.data[0], status: "DEPRECATED" }] }, { userId: "user", data: [{}] }]) assert.throws(() => parseBookmarkedPosts(value, "user"));
});

test("My Comments accepts only the current USER's pending or approved comments without list associations", () => {
  const comment = { id: "own-1", userId: "user", name: "نرگس رضایی", text: "دیدگاه من", status: "PENDING", postId: "article-1" };
  assert.deepEqual(parseOwnComments([comment], "user"), [{ id: "own-1", name: "نرگس رضایی", text: "دیدگاه من", status: "PENDING" }]);
  assert.equal(parseOwnComments([{ ...comment, status: "APPROVED" }], "user")[0].status, "APPROVED");
  assert.deepEqual(parseOwnComments([], "user"), []);
  for (const value of [[{ ...comment, userId: "other" }], [{ ...comment, userId: undefined }], [{ ...comment, status: "UNKNOWN" }], [comment, comment], null]) assert.throws(() => parseOwnComments(value, "user"));
});

test("public article comments accept only approved records and nonempty comment text", () => {
  const comment = { id: "comment-1", name: "نرگس رضایی", text: "دیدگاه تأییدشده", status: "APPROVED" };
  assert.deepEqual(parseApprovedComments([comment]), [comment]);
  assert.deepEqual(parseApprovedComments([]), []);
  assert.throws(() => parseApprovedComments([{ ...comment, status: "PENDING" }]));
  assert.throws(() => parseApprovedComments([comment, comment]));
  assert.throws(() => parseApprovedComments([{ ...comment, text: " " }]));
  assert.equal(validateArticleCommentText("  یک دیدگاه دربارهٔ مقاله  "), "");
  for (const value of ["", " \n\t", null, {}, 4]) assert.notEqual(validateArticleCommentText(value), "");
});

test("login password characters reject non-ASCII and whitespace without registration complexity rules", () => {
  for (const password of ["a", "123", "!", "simple-password", "abcdef1!"]) assert.equal(validatePasswordCharacters(password), "");
  for (const password of ["", "فارسی123!", "abcé", "abc۱", "abc😀", " abc", "abc ", "a b", "a\tb", "a\nb", "a\rb", "a\u00a0b", "a\u0000b", "a\u007fb"]) {
    assert.notEqual(validatePasswordCharacters(password), "", JSON.stringify(password));
  }
});

test("registration passwords require printable ASCII letters, a digit, a symbol and exact confirmation", () => {
  assert.deepEqual(validateRegistrationPasswords("abcdef1!", "abcdef1!"), { password: "", confirmPassword: "" });
  for (const password of ["", "Ab1!xyz", "1234567!", "abcdefgh!", "abcdef12", "Abcdef1!فارسی", "Abcdef1!é", "Abcdef1! ", "Abcdef1!\t", "Abcdef1!\n", "Abcdef1!\u0000", "Abcdef1!\u007f", "Abcdef1!\u00a0"]) {
    assert.notEqual(validateRegistrationPasswords(password, password).password, "", JSON.stringify(password));
  }
  for (const confirmation of ["", "abcdef1! ", "Abcdef1!"]) {
    assert.notEqual(validateRegistrationPasswords("abcdef1!", confirmation).confirmPassword, "");
  }
});

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
  assert.deepEqual(parsePublishedPosts(withCover).data[0].coverImage, {
    ...cover,
    width: null,
    height: null,
  });
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

// Actual-shaped Nest `coverImage: { id, url, width, height, alt }` (#49).
const nestCover = {
  id: "7a3e0fe6-81f3-4f42-b61e-361beea3a217",
  url: "https://res.cloudinary.com/demo/image/upload/v1/articles/cover.png",
  width: 800,
  height: 450,
  alt: "جلد مقاله",
};
const mediaId = "7a3e0fe6-81f3-4f42-b61e-361beea3a217";
const safeMediaUrl = "https://res.cloudinary.com/demo/image/upload/v1/articles/body.png";

test("public cover parsing accepts the Nest shape and rejects unsafe references", () => {
  const withNestCover = { ...feed, data: [{ ...feed.data[0], coverImage: nestCover }] };
  assert.deepEqual(parsePublishedPosts(withNestCover).data[0].coverImage, {
    src: nestCover.url,
    alt: nestCover.alt,
    width: nestCover.width,
    height: nestCover.height,
  });
  assert.equal(parsePublishedPosts(feed).data[0].coverImage, null);
  for (const coverImage of [
    { ...nestCover, url: "http://res.cloudinary.com/demo/image/upload/a.png" },
    { ...nestCover, url: "javascript:alert(1)" },
    { ...nestCover, url: "https://user:pass@res.cloudinary.com/demo/image/upload/a.png" },
    { ...nestCover, url: "https://evil.test/demo/image/upload/a.png" },
    { ...nestCover, url: "https://res.cloudinary.com/demo/raw/upload/a.png" },
    { ...nestCover, url: "https://res.cloudinary.com:8443/demo/image/upload/a.png" },
    { ...nestCover, url: "https://res.cloudinary.com/demo/image/upload/a.png?x=1" },
    { ...nestCover, url: "https://res.cloudinary.com/demo/image/upload/a.png#x" },
    { ...nestCover, alt: " " },
    { id: nestCover.id, url: nestCover.url, width: 800, height: 450 },
    { ...nestCover, width: 0 },
  ]) {
    assert.throws(() =>
      parsePublishedPosts({ ...feed, data: [{ ...feed.data[0], coverImage }] }),
    );
  }
});

const richDocument = {
  type: "doc",
  attrs: { dir: "rtl" },
  content: [
    {
      type: "heading",
      attrs: { level: 2, dir: "rtl" },
      content: [{ type: "text", text: "عنوان" }],
    },
    {
      type: "paragraph",
      attrs: { dir: "rtl" },
      content: [
        { type: "text", text: "متن ", marks: [{ type: "bold" }] },
        { type: "text", text: "کد", marks: [{ type: "code" }] },
        { type: "hardBreak" },
        {
          type: "text",
          text: "پیوند",
          marks: [{ type: "link", attrs: { href: "https://example.test/x", target: "_blank" } }],
        },
      ],
    },
    { type: "image", attrs: { mediaId, alt: "تصویر متن" } },
    {
      type: "blockquote",
      content: [{ type: "paragraph", content: [{ type: "text", text: "نقل" }] }],
    },
    {
      type: "orderedList",
      attrs: { start: 2 },
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "اول" }] }],
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "ts" },
      content: [{ type: "text", text: "const x = 1;" }],
    },
  ],
};

const richDetail = {
  ...previewPosts[0],
  coverImage: nestCover,
  content: "عنوان متن",
  contentDocument: richDocument,
  contentMedia: [{ id: mediaId, url: safeMediaUrl, width: 800, height: 450 }],
};

test("detail parsing accepts a Nest rich document and resolves media by id", () => {
  const detail = parsePublishedPost(richDetail);
  assert.equal(detail.contentDocument.type, "doc");
  assert.deepEqual(detail.contentMedia, [
    { id: mediaId, url: safeMediaUrl, width: 800, height: 450 },
  ]);
  assert.deepEqual(detail.coverImage, {
    src: nestCover.url,
    alt: nestCover.alt,
    width: nestCover.width,
    height: nestCover.height,
  });
  assert.equal(detail.content, "عنوان متن");
});

test("legacy detail keeps plain text and an empty media projection", () => {
  for (const payload of [
    { ...previewPosts[0], contentDocument: null },
    previewPosts[0],
  ]) {
    const detail = parsePublishedPost(payload);
    assert.equal(detail.contentDocument, null);
    assert.deepEqual(detail.contentMedia, []);
    assert.equal(detail.content, payload.content);
  }
});

test("rich documents and media projections reject unsafe or malformed values", () => {
  const unsafeDocuments = [
    {
      ...richDocument,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "پیوند",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    },
    { ...richDocument, content: [{ type: "image", attrs: { mediaId: "not-a-uuid", alt: "x" } }] },
    { ...richDocument, content: [{ type: "image", attrs: { mediaId, alt: " " } }] },
    { ...richDocument, content: [{ type: "table" }] },
    "not-a-document",
  ];
  for (const contentDocument of unsafeDocuments) {
    assert.throws(
      () => parsePublishedPost({ ...richDetail, contentDocument }),
      /Invalid content document/,
    );
  }

  for (const contentMedia of [
    [{ id: mediaId, url: "http://res.cloudinary.com/demo/image/upload/a.png", width: 1, height: 1 }],
    [{ id: mediaId, url: "javascript:alert(1)", width: 1, height: 1 }],
    [{ id: mediaId, url: "https://evil.test/demo/image/upload/a.png", width: 1, height: 1 }],
    [{ id: mediaId, url: "https://res.cloudinary.com/demo/raw/upload/a.png", width: 1, height: 1 }],
    [{ id: mediaId, url: "https://res.cloudinary.com:8443/demo/image/upload/a.png", width: 1, height: 1 }],
    [{ id: mediaId, url: safeMediaUrl + "?v=1", width: 1, height: 1 }],
    [{ id: mediaId, url: safeMediaUrl, width: "800", height: 450 }],
    [
      { id: mediaId, url: safeMediaUrl, width: 1, height: 1 },
      { id: mediaId, url: safeMediaUrl, width: 1, height: 1 },
    ],
  ]) {
    assert.throws(() => parseContentMedia(contentMedia), /Invalid content media/);
  }
});

test("rich blocks resolve verified media and never fall back to a URL", () => {
  const document = parseRichDocument(richDocument);
  const blocks = buildRichBlocks(document, parseContentMedia(richDetail.contentMedia));
  assert.deepEqual(blocks.map((block) => block.kind), [
    "heading",
    "paragraph",
    "image",
    "blockquote",
    "list",
    "codeBlock",
  ]);

  const paragraph = blocks[1];
  assert.equal(paragraph.runs[0].bold, true);
  assert.equal(paragraph.runs[1].code, true);
  assert.equal(paragraph.runs[2].kind, "break");
  assert.equal(paragraph.runs[3].href, "https://example.test/x");

  const image = blocks[2];
  assert.equal(image.media.url, safeMediaUrl);
  assert.equal(image.alt, "تصویر متن");

  for (const media of [
    [],
    [{ id: "another-media", url: safeMediaUrl, width: 1, height: 1 }],
    [{ id: mediaId, url: "http://insecure.test/a.png", width: 1, height: 1 }],
  ]) {
    const unresolved = buildRichBlocks(document, media).find((block) => block.kind === "image");
    assert.equal(unresolved.media, null);
    assert.equal(unresolved.alt, "تصویر متن");
  }

  assert.equal(blocks[4].ordered, true);
  assert.equal(blocks[4].start, 2);
  assert.equal(blocks[5].text, "const x = 1;");
});

test("rich text stays literal text and is never parsed as HTML", () => {
  const hostile = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: '<script>alert("x")</script>' }],
      },
    ],
  };
  const blocks = buildRichBlocks(parseRichDocument(hostile), []);
  assert.equal(blocks[0].runs[0].text, '<script>alert("x")</script>');
});

test("whitespace-only text nodes match the backend and are preserved verbatim", () => {
  const document = parseRichDocument({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: " " }] }],
  });
  assert.equal(document.content[0].content[0].text, " ");
  assert.equal(buildRichBlocks(document, [])[0].runs[0].text, " ");
});

test("inline image nodes are rejected instead of silently degrading", () => {
  assert.throws(
    () =>
      parseRichDocument({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "image", attrs: { mediaId, alt: "تصویر" } }],
          },
        ],
      }),
    /Invalid content document/,
  );
});

test("server media is only accepted from the Cloudinary image delivery path", () => {
  const document = parseRichDocument(richDocument);
  for (const url of [
    "https://evil.test/demo/image/upload/a.png",
    "https://res.cloudinary.com/demo/raw/upload/a.png",
    "http://res.cloudinary.com/demo/image/upload/a.png",
  ]) {
    const image = buildRichBlocks(document, [
      { id: mediaId, url, width: 1, height: 1 },
    ]).find((block) => block.kind === "image");
    assert.equal(image.media, null);
  }
});

test("link target semantics are preserved from the backend document", () => {
  const document = parseRichDocument({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "new tab",
            marks: [
              {
                type: "link",
                attrs: { href: "https://example.test/blank", target: "_blank" },
              },
            ],
          },
          {
            type: "text",
            text: "same tab",
            marks: [{ type: "link", attrs: { href: "https://example.test/same" } }],
          },
        ],
      },
    ],
  });
  const runs = buildRichBlocks(document, [])[0].runs;
  assert.equal(runs[0].target, "_blank");
  assert.equal(runs[1].href, "https://example.test/same");
  assert.equal(runs[1].target, undefined);
});
