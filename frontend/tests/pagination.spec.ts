import { expect, test } from "@playwright/test";

test("a Visitor browses Published Posts with reload and browser history", async ({ page }, testInfo) => {
  await page.goto("/");
  const pagination = page.getByRole("navigation", { name: "صفحه‌بندی مقاله‌ها" });
  await expect(pagination.getByRole("link", { name: "صفحهٔ قبل" })).toHaveCount(0);
  await pagination.getByRole("link", { name: "صفحهٔ بعد" }).click();
  await expect(page).toHaveURL(/\/?\?page=2$/);
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(page.getByRole("article").first()).toContainText("خواندن مقاله‌های بیشتر");
  await expect(pagination).toContainText("صفحهٔ ۲ از ۲");
  await expect(pagination.getByRole("link", { name: "صفحهٔ بعد" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.goBack();
  await expect(page.getByRole("article")).toHaveCount(10);
  await page.goForward();
  await expect(page.getByRole("article")).toHaveCount(2);
  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await pagination.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`pagination-${width}.png`), fullPage: true });
  }
  const previous = pagination.getByRole("link", { name: "صفحهٔ قبل" });
  await previous.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("article")).toHaveCount(10);
});

test("invalid pages normalize safely and an out-of-range page differs from an empty blog", async ({ page, request }) => {
  for (const query of ["page=abc", "page=0", "page=-2", "page=1.5", "page=9007199254740992", "page=2&page=1", "page=", "page=1e2"]) {
    await page.goto(`/?${query}&limit=1&author=ignored&unexpected=ignored`);
    await expect(page.getByRole("article")).toHaveCount(10);
    await expect(page.getByRole("navigation", { name: "صفحه‌بندی مقاله‌ها" })).toContainText("صفحهٔ ۱ از ۲");
  }
  await page.goto("/?page=3");
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByText("در این صفحه مقاله‌ای وجود ندارد.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "بازگشت به صفحهٔ اول" }).click();
  await expect(page.getByRole("article")).toHaveCount(10);
  try {
    expect((await request.post("http://127.0.0.1:4101/__test/posts?mode=empty")).ok()).toBe(true);
    await page.goto("/?page=3");
    await expect(page.getByText("هنوز مقاله‌ای منتشر نشده است.", { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "صفحه‌بندی مقاله‌ها" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "بازگشت به صفحهٔ اول" })).toHaveCount(0);
  } finally {
    await request.post("http://127.0.0.1:4101/__test/posts?mode=success");
  }
});
