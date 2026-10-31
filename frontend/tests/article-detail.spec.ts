import { expect, test } from "@playwright/test";
import { previewPosts } from "./fixtures/preview-posts.mjs";

test.afterEach(async ({ request }) => {
  await request.post("http://127.0.0.1:4101/__test/details?mode=success");
});

test("missing and unpublished slugs return real HTTP 404 while API failures remain recoverable", async ({ page, request }) => {
  for (const slug of ["missing-post", "draft-post", "deprecated-post", "missing%3Fquery%3Dyes"]) {
    const response = await page.goto(`/posts/${slug}`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("مقاله پیدا نشد");
    await expect(page.getByRole("link", { name: "بازگشت به مقاله‌ها", exact: true })).toHaveAttribute("href", "/");
    await expect(page.getByRole("article")).toHaveCount(0);
  }
  for (const mode of ["error", "rate-limit", "malformed", "invalid", "non-public", "disconnect"]) {
    await request.post(`http://127.0.0.1:4101/__test/details?mode=${mode}`);
    const response = await page.goto("/posts/test-post-1");
    expect(response?.status()).not.toBe(404);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت مقاله ممکن نشد.");
    await expect(page.getByRole("article")).toHaveCount(0);
    await expect(page.getByRole("main")).not.toContainText("TEST DOUBLE");
  }
  await request.post("http://127.0.0.1:4101/__test/details?mode=success");
  const retry = page.getByRole("button", { name: "تلاش دوباره" });
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/posts\/test-post-1$/);
  await expect(page.getByRole("article")).toBeVisible();
  await expect(page.getByRole("article").locator("time")).toHaveText("۱ فروردین ۱۴۰۵");
  await page.goto("/posts/test-post-2");
  await expect(page.getByRole("article")).toContainText("nima");
  await expect(page.getByRole("article").locator("time, ul")).toHaveCount(0);
});

test("a Visitor reads an article from a paginated feed and safely renders realistic Persian content", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  const browserApiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).port === "4101" || request.url().includes("example.invalid")) browserApiRequests.push(request.url());
  });
  await page.goto("/?page=2");
  const link = page.getByRole("article").first().getByRole("link");
  await expect(link).toHaveAttribute("href", "/posts/test-post-11");
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/posts\/test-post-11$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("خواندن مقاله‌های بیشتر");
  expect((await page.reload())?.status()).toBe(200);
  await page.goBack();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByRole("article")).toHaveCount(2);

  const response = await page.goto("/posts/preview-article-1");
  expect(response?.status()).toBe(200);
  expect(await response!.text()).toContain("از درخواست تا صفحه");
  const article = page.getByRole("article");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("راهنمای Next.js و معماری وب");
  await expect(article).toContainText("نیما کیانی");
  await expect(article.getByRole("list", { name: "برچسب‌های مقاله" })).toContainText("برنامه‌نویسی");
  await expect(article.getByRole("list", { name: "دسته‌بندی‌های مقاله" })).toContainText("توسعهٔ وب");
  await expect(article.locator("time")).toContainText("۱۴۰۵");
  const body = page.getByRole("region", { name: "متن مقاله" });
  await expect(body).toContainText('const title = "Next.js & TypeScript";');
  await expect(body).toContainText("<script>window.articleInjected = true</script>");
  await expect(body.locator("script, img, a")).toHaveCount(0);
  expect(await page.evaluate(() => "articleInjected" in window)).toBe(false);
  expect(browserApiRequests).toEqual([]);
  for (const width of [360, 390, 1280]) {
    if (width === 1280) await page.getByRole("button", { name: "فعال‌کردن حالت روشن" }).click();
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`article-${width}.png`), fullPage: true });
  }
});

test("all 25 preview articles have matching detailed content and list records retain their metadata", async ({ request }) => {
  expect(previewPosts).toHaveLength(25);
  expect(new Set(previewPosts.map((post) => post.id)).size).toBe(25);
  expect(new Set(previewPosts.map((post) => post.slug)).size).toBe(25);
  const lengths: number[] = [];
  for (const expected of previewPosts) {
    const response = await request.get(`http://127.0.0.1:4101/posts/${expected.slug}`);
    expect(response.status()).toBe(200);
    const post = await response.json();
    expect(post).toEqual(expected);
    expect(post.content).toContain("\n\n");
    lengths.push(post.content.length);
  }
  expect(Math.max(...lengths)).toBeGreaterThan(Math.min(...lengths) * 3);
  for (const page of [1, 2]) {
    const feed = await request.get(`http://127.0.0.1:4101/posts?page=${page}&limit=10&sort=newest`).then((response) => response.json());
    for (const post of feed.data) {
      const detail = await request.get(`http://127.0.0.1:4101/posts/${post.slug}`).then((response) => response.json());
      expect(detail).toEqual(post);
    }
  }
});
