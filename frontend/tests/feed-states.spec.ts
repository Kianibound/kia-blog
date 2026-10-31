import { expect, test } from "@playwright/test";

test.afterEach(async ({ request }) => {
  await request.post("http://127.0.0.1:4101/__test/posts?mode=success");
});

test("a Visitor can use the shell while the feed loads, including pagination navigation", async ({ page, request }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await request.post("http://127.0.0.1:4101/__test/posts?mode=slow");
  await page.goto("/", { waitUntil: "commit" });
  const loading = page.getByRole("status");
  await expect(loading).toHaveText("در حال دریافت مقاله‌ها…");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("loading-360.png"), fullPage: true });
  await expect(page.getByRole("article")).toHaveCount(10);
  await expect(loading).toHaveCount(0);
  await page.getByRole("link", { name: "صفحهٔ بعد" }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(loading).toHaveText("در حال دریافت مقاله‌ها…");
  await expect(page.getByRole("article")).toHaveCount(2);
});

test("a Visitor sees a safe feed error and retries the selected page by keyboard", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/posts?mode=error");
  await page.goto("/?page=2");
  const error = page.getByRole("main").getByRole("alert");
  await expect(error).toContainText("دریافت مقاله‌ها ممکن نشد.");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByText("هنوز مقاله‌ای منتشر نشده است.", { exact: true })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("TEST DOUBLE");
  await request.post("http://127.0.0.1:4101/__test/posts?mode=success");
  const retry = error.getByRole("button", { name: "تلاش دوباره" });
  await retry.focus();
  await expect(retry).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(error).toHaveCount(0);
});

test("empty and failed feeds remain distinct and usable on small screens in both themes", async ({ page, request }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 360, height: 900 });
  await request.post("http://127.0.0.1:4101/__test/posts?mode=empty");
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("status")).toHaveText("هنوز مقاله‌ای منتشر نشده است.");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("empty-dark-360.png"), fullPage: true });
  await request.post("http://127.0.0.1:4101/__test/posts?mode=error");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.reload();
  await page.getByRole("button", { name: "فعال‌کردن حالت روشن" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت مقاله‌ها ممکن نشد.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("error-light-390.png"), fullPage: true });
});

test("rate limits, malformed responses, invalid fields, network failure and timeout show safe errors", async ({ page, request }) => {
  for (const mode of ["rate-limit", "malformed", "invalid", "disconnect", "timeout"]) {
    await request.post(`http://127.0.0.1:4101/__test/posts?mode=${mode}`);
    await page.goto("/");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت مقاله‌ها ممکن نشد.");
    await expect(page.getByText("هنوز مقاله‌ای منتشر نشده است.", { exact: true })).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("TEST DOUBLE");
  }
});
