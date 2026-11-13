import assert from "node:assert/strict";
import test from "node:test";
import {
  parseProfile,
  profileFailure,
} from "../src/lib/profile-contract.ts";

const profile = {
  id: "u-1",
  email: "author@example.test",
  username: "author",
  name: "سارا",
  avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/avatar/a.png",
  emailVerified: true,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  role: { name: "AUTHOR" },
};

test("profiles keep only the safe fields and accept a null avatar", () => {
  assert.deepEqual(parseProfile(profile), {
    id: "u-1",
    email: "author@example.test",
    username: "author",
    name: "سارا",
    avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/avatar/a.png",
  });
  assert.deepEqual(parseProfile({ ...profile, avatarUrl: null }), {
    id: "u-1",
    email: "author@example.test",
    username: "author",
    name: "سارا",
    avatarUrl: null,
  });
});

test("unsafe or malformed avatar projections are rejected outright", () => {
  for (const avatarUrl of [
    "http://res.cloudinary.com/demo/a.png",
    "javascript:alert(1)",
    "/fixture-images/abc",
    "https://evil.test/a.png",
    5,
  ]) {
    assert.equal(parseProfile({ ...profile, avatarUrl }), null);
  }
  assert.equal(parseProfile({ ...profile, id: "" }), null);
  assert.equal(parseProfile({ ...profile, username: 1 }), null);
  assert.equal(parseProfile(null), null);
});

test("avatar failures map to the documented distinct reasons", () => {
  assert.equal(profileFailure(401), "unauthorized");
  assert.equal(profileFailure(404), "not-found");
  assert.equal(profileFailure(409), "conflict");
  assert.equal(profileFailure(413), "too-large");
  assert.equal(profileFailure(400), "invalid");
  assert.equal(profileFailure(422), "invalid");
  assert.equal(profileFailure(503), "unavailable");
  assert.equal(profileFailure(418), "protocol");
});
