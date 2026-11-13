import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessDashboard,
  dashboardDestination,
  dashboardDestinations,
  dashboardLoginHref,
  dashboardSectionMeta,
  toDashboardIdentity,
} from "../src/lib/dashboard/access.ts";

const roles = ["USER", "AUTHOR", "ADMIN"];

test("dashboard navigation is role-specific and never includes other roles' sections", () => {
  const user = dashboardDestinations("USER").map((item) => item.href);
  const author = dashboardDestinations("AUTHOR").map((item) => item.href);
  const admin = dashboardDestinations("ADMIN").map((item) => item.href);

  assert.deepEqual(user, ["/dashboard", "/dashboard/bookmarks", "/dashboard/my-comments"]);
  assert.deepEqual(author, ["/dashboard", "/dashboard/workspace", "/dashboard/posts", "/dashboard/avatar"]);
  assert.deepEqual(admin, ["/dashboard", "/dashboard/workspace", "/dashboard/categories", "/dashboard/comments", "/dashboard/posts", "/dashboard/authors"]);
  for (const href of ["/dashboard/comments", "/dashboard/categories", "/dashboard/authors"]) {
    assert.ok(admin.includes(href));
    assert.ok(!author.includes(href));
    assert.ok(!user.includes(href));
  }
});

test("cross-role and deep-link authorization is denied server-side", () => {
  const allowed = {
    USER: [[], ["bookmarks"], ["my-comments"]],
    AUTHOR: [[], ["workspace"], ["posts"], ["avatar"]],
    ADMIN: [[], ["workspace"], ["posts"], ["comments"], ["categories"], ["authors"], ["authors", "new"]],
  };
  const allSections = [[], ["workspace"], ["posts"], ["comments"], ["categories"], ["authors"], ["authors", "new"], ["bookmarks"], ["my-comments"], ["avatar"]];

  for (const role of roles) {
    const allowedKeys = new Set(allowed[role].map((section) => section.join("/")));
    for (const section of allSections) {
      assert.equal(
        canAccessDashboard(role, section),
        allowedKeys.has(section.join("/")),
        `${role} access mismatch for /${section.join("/")}`,
      );
    }
  }
  assert.equal(canAccessDashboard("USER", ["comments"]), false);
  assert.equal(canAccessDashboard("AUTHOR", ["categories"]), false);
  assert.equal(canAccessDashboard("ADMIN", ["bookmarks"]), false);
  assert.equal(canAccessDashboard("ADMIN", ["workspace", "authors"]), false);
  assert.equal(canAccessDashboard("UNKNOWN", []), false);
  assert.equal(canAccessDashboard("ADMIN", ["unknown"]), false);
});

test("section metadata is available only after authorization", () => {
  assert.equal(dashboardSectionMeta("ADMIN", ["comments"])?.title, "کامنت‌ها");
  assert.equal(dashboardSectionMeta("USER", ["comments"]), null);
  assert.equal(dashboardSectionMeta("AUTHOR", ["bookmarks"]), null);
  assert.equal(dashboardSectionMeta("USER", [])?.title, "پیشخوان");
  assert.equal(dashboardSectionMeta("ADMIN", ["authors", "new"])?.title, "افزودن نویسنده");
  assert.equal(dashboardSectionMeta("AUTHOR", ["authors", "new"]), null);
});

test("dashboard paths and login return links are encoded and same-origin", () => {
  assert.equal(dashboardDestination([]), "/dashboard");
  assert.equal(dashboardDestination(["posts"]), "/dashboard/posts");
  assert.equal(dashboardDestination(["a b"]), "/dashboard/a%20b");
  assert.equal(dashboardLoginHref([]), "/login?next=%2Fdashboard");
  assert.equal(
    dashboardLoginHref(["comments"]),
    "/login?next=%2Fdashboard%2Fcomments",
  );
});

test("dashboard identity derives only from the verified account user", () => {
  assert.deepEqual(
    toDashboardIdentity({
      id: "user-1",
      email: "author@example.test",
      username: "author",
      name: "نویسنده",
      role: "AUTHOR",
    }),
    { name: "نویسنده", username: "author", role: "AUTHOR" },
  );
  assert.equal(
    toDashboardIdentity({
      id: "user-2",
      email: "admin@example.test",
      username: "admin",
      name: null,
      role: "ADMIN",
    }).role,
    "ADMIN",
  );
});
