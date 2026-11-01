import { expect, test } from "@playwright/test";

test("production has no private dashboard or test identity entry", async ({ request }) => {
  for (const path of ["/dashboard", "/dashboard/workspace", "/dashboard/posts", "/dashboard?role=ADMIN&preview=true", "/__test/dashboard", "/dashboard-identity", "/dashboard-posts"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("داده‌های آزمایشی");
  }
});
