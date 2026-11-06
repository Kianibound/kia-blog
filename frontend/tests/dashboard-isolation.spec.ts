import { expect, test } from "@playwright/test";

test("production has no private dashboard or test identity entry", async ({ request }) => {
  expect((await request.get("/dashboard/bookmarks")).status()).toBe(404);
  expect((await request.get("/dashboard-bookmarks")).status()).toBe(404);
  expect((await request.put("/article-bookmarks/test-post-2")).status()).toBe(404);
  expect((await request.get("/dashboard/my-comments")).status()).toBe(404);
  expect((await request.get("/dashboard-my-comments")).status()).toBe(404);
  expect((await request.patch("/dashboard-my-comments/own-1", { data: { text: "fixture-only" } })).status()).toBe(404);
  expect((await request.post("/article-comments/test-post-2", { data: { text: "fixture-only" } })).status()).toBe(404);
  const article = await request.get("/posts/test-post-2");
  expect(article.status()).toBe(200);
  expect(await article.text()).not.toContain('id="article-comment"');
  expect(await article.text()).not.toContain('aria-label="ذخیره‌سازی مقاله"');
  for (const path of ["/preview/posts", "/preview/posts/test-post-1", "/dashboard-public-posts", "/dashboard", "/dashboard/workspace", "/dashboard/posts", "/dashboard/posts/new", "/dashboard/posts/00000000-0000-4000-8000-000000000001/edit", "/dashboard?role=ADMIN&preview=true", "/__test/dashboard", "/dashboard-identity", "/dashboard-posts", "/dashboard-taxonomy"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("داده‌های آزمایشی");
  }
});
