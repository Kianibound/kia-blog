import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthorFailure,
  deactivateAuthorFailure,
  parseAdminAuthor,
  parseAdminAuthorList,
} from "../src/lib/admin-authors-contract.ts";
import { validateAuthorCreateInput } from "../src/lib/author-form-contract.ts";

const author = {
  id: "author-1",
  name: "سارا",
  email: "sara@example.test",
  username: "sara",
  role: { name: "AUTHOR" },
  disabledAt: null,
};

const adminUser = {
  id: "admin-1",
  name: "مدیر",
  email: "admin@example.test",
  username: "admin",
  role: { name: "ADMIN" },
  disabledAt: null,
};

test("admin author parsing accepts AUTHOR rows and rejects other roles", () => {
  assert.deepEqual(parseAdminAuthor(author), {
    id: "author-1",
    name: "سارا",
    email: "sara@example.test",
    username: "sara",
    disabledAt: null,
  });
  assert.equal(parseAdminAuthor(adminUser), null);
  assert.equal(parseAdminAuthor({ ...author, id: "" }), null);
  assert.equal(parseAdminAuthor({ ...author, role: { name: "USER" } }), null);
  assert.equal(parseAdminAuthor({ ...author, disabledAt: 12 }), null);
  assert.equal(parseAdminAuthor(null), null);
});

test("the ADMIN users list filters out non-author accounts", () => {
  const users = [
    { ...adminUser },
    { ...author },
    { ...author, id: "author-2", name: null, username: "nima", disabledAt: "2026-02-01T10:00:00.000Z" },
  ];
  assert.deepEqual(
    parseAdminAuthorList(users)?.map((item) => item.id),
    ["author-1", "author-2"],
  );
  assert.equal(parseAdminAuthorList({ data: [] }), null);
  assert.equal(
    parseAdminAuthorList([users[0], { ...author, email: "" }]),
    null,
  );
});

test("Nest status failures map to distinct Persian-facing reasons", () => {
  assert.equal(createAuthorFailure(409), "duplicate");
  assert.equal(createAuthorFailure(400), "validation");
  assert.equal(createAuthorFailure(422), "validation");
  assert.equal(createAuthorFailure(401), "unauthorized");
  assert.equal(createAuthorFailure(403), "forbidden");
  assert.equal(createAuthorFailure(404), "not-found");
  assert.equal(createAuthorFailure(503), "unavailable");
  assert.equal(createAuthorFailure(418), "protocol");

  assert.equal(deactivateAuthorFailure(404), "not-found");
  assert.equal(deactivateAuthorFailure(409), "conflict");
  assert.equal(deactivateAuthorFailure(401), "unauthorized");
  assert.equal(deactivateAuthorFailure(403), "forbidden");
  assert.equal(deactivateAuthorFailure(503), "unavailable");
});

test("initial password validation mirrors the exact Nest policy", () => {
  const base = { name: "نویسنده", email: "author@example.test" };
  const invalid = (password) =>
    validateAuthorCreateInput({ ...base, password }).password;

  assert.equal(invalid("Secret1!"), undefined);
  assert.ok(invalid("Secret1"));
  assert.ok(invalid("SECRET!"));
  assert.ok(invalid("Secret!"));
  assert.ok(invalid("Secret 1!"));
  assert.ok(invalid("گذرواژه1!"));
  assert.ok(invalid(""));
});

test("author fields are trimmed requirements, not credentials", () => {
  const errors = validateAuthorCreateInput({
    name: "   ",
    email: "not-an-email",
    password: "Secret1!",
  });
  assert.equal(errors.name, "required");
  assert.equal(errors.email, "format");
  assert.equal(errors.password, undefined);
  assert.deepEqual(
    validateAuthorCreateInput({
      name: "نویسنده",
      email: "author@example.test",
      password: "Secret1!",
    }),
    {},
  );
});
