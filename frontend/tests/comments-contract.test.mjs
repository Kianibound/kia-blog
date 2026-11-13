import assert from "node:assert/strict";
import test from "node:test";
import {
  approveVersionIsValid,
  commentFailure,
  parseAdminCommentPage,
  parseOwnCommentPage,
  parsePublicComments,
  validateCommentText,
} from "../src/lib/comments-contract.ts";

const author = { id: "a-1", username: "sara", name: "سارا", avatarUrl: null };
const nima = { id: "a-2", username: "user_nima", name: null, avatarUrl: null };

const approvedReply = {
  id: "r-1",
  content: "پاسخ تأییدشده",
  status: "APPROVED",
  version: 1,
  postId: "p-1",
  authorId: "a-2",
  parentId: "c-1",
  createdAt: "2026-02-01T10:00:00.000Z",
  updatedAt: "2026-02-01T10:00:00.000Z",
  author: nima,
};

const approvedRoot = {
  id: "c-1",
  content: "دیدگاه تأییدشده",
  status: "APPROVED",
  version: 2,
  postId: "p-1",
  authorId: "a-1",
  parentId: null,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  author,
  replies: [approvedReply],
};

const ownRow = {
  id: "c-2",
  content: "دیدگاه من",
  status: "PENDING",
  version: 1,
  postId: "p-1",
  authorId: "u-1",
  parentId: null,
  createdAt: "2026-03-01T10:00:00.000Z",
  updatedAt: "2026-03-01T10:00:00.000Z",
};

const meta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

test("public comments keep only approved roots and direct approved replies", () => {
  const parsed = parsePublicComments([approvedRoot]);
  assert.deepEqual(parsed, [
    {
      id: "c-1",
      content: "دیدگاه تأییدشده",
      authorName: "سارا",
      createdAt: "2026-01-01T10:00:00.000Z",
      replies: [
        {
          id: "r-1",
          content: "پاسخ تأییدشده",
          authorName: "user_nima",
          createdAt: "2026-02-01T10:00:00.000Z",
        },
      ],
    },
  ]);
  assert.deepEqual(parsePublicComments([]), []);
});

test("a single PENDING row invalidates the public payload instead of leaking text", () => {
  assert.equal(parsePublicComments([{ ...approvedRoot, status: "PENDING" }]), null);
  assert.equal(
    parsePublicComments([{ ...approvedRoot, replies: [{ ...approvedReply, status: "PENDING" }] }]),
    null,
  );
  assert.equal(parsePublicComments({ data: [approvedRoot] }), null);
});

test("own comment pages validate pagination and keep PENDING and APPROVED rows", () => {
  const page = parseOwnCommentPage(
    { data: [ownRow, { ...ownRow, id: "c-3", status: "APPROVED" }], meta: meta(1, 10, 2) },
    1,
    10,
  );
  assert.equal(page?.data.length, 2);
  assert.deepEqual(page?.meta, meta(1, 10, 2));
  assert.equal(parseOwnCommentPage({ data: [ownRow], meta: meta(2, 10, 1) }, 1, 10), null);
  assert.equal(parseOwnCommentPage({ data: [], meta: { ...meta(1, 10, 0), totalPages: 9 } }, 1, 10), null);
  assert.equal(parseOwnCommentPage({ data: [{ ...ownRow, status: "REJECTED" }], meta: meta(1, 10, 1) }, 1, 10), null);
});

test("admin rows expose safe author identity and the version needed to approve", () => {
  const row = {
    id: "c-9",
    status: "PENDING",
    content: "در انتظار",
    version: 3,
    author,
    createdAt: "2026-04-01T10:00:00.000Z",
    updatedAt: "2026-04-01T10:00:00.000Z",
  };
  const page = parseAdminCommentPage({ data: [row], meta: meta(1, 10, 1) }, 1, 10);
  assert.equal(page?.data[0].version, 3);
  assert.equal(page?.data[0].authorName, "سارا");
  assert.equal(parseAdminCommentPage({ data: [{ ...row, version: 0 }], meta: meta(1, 10, 1) }, 1, 10), null);
  assert.equal(parseAdminCommentPage({ data: [{ ...row, author: null }], meta: meta(1, 10, 1) }, 1, 10), null);
});

test("content is required after trimming and approval versions are positive integers", () => {
  assert.equal(validateCommentText("  متن  "), null);
  assert.equal(validateCommentText("   "), "required");
  assert.equal(validateCommentText(undefined), "required");
  assert.equal(approveVersionIsValid(1), true);
  assert.equal(approveVersionIsValid(0), false);
  assert.equal(approveVersionIsValid(1.5), false);
  assert.equal(approveVersionIsValid("1"), false);
});

test("write statuses map to distinct reasons, with 409 kept as conflict", () => {
  assert.equal(commentFailure(400), "validation");
  assert.equal(commentFailure(422), "validation");
  assert.equal(commentFailure(401), "unauthorized");
  assert.equal(commentFailure(403), "forbidden");
  assert.equal(commentFailure(404), "not-found");
  assert.equal(commentFailure(409), "conflict");
  assert.equal(commentFailure(503), "unavailable");
  assert.equal(commentFailure(418), "protocol");
});
