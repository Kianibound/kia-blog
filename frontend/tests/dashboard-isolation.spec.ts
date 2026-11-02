import { expect, test } from "@playwright/test";

test("production has no private dashboard or test identity entry", async ({ request }) => {
  for (const path of ["/preview/posts", "/preview/posts/test-post-1", "/dashboard-public-posts", "/dashboard", "/dashboard/workspace", "/dashboard/posts", "/dashboard/posts/new", "/dashboard/posts/00000000-0000-4000-8000-000000000001/edit", "/dashboard?role=ADMIN&preview=true", "/__test/dashboard", "/dashboard-identity", "/dashboard-posts", "/dashboard-taxonomy"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("داده‌های آزمایشی");
  }
});
