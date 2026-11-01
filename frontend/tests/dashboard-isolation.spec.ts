import { expect, test } from "@playwright/test";

test("production has no private dashboard or test identity entry", async ({ request }) => {
  for (const path of ["/dashboard", "/dashboard/workspace", "/dashboard?role=ADMIN&preview=true", "/__test/dashboard", "/dashboard-identity"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("داده‌های آزمایشی");
  }
});
