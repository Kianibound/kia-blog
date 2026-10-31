import { expect, test } from "@playwright/test";

test.afterEach(async ({ request }) => {
  await request.post("http://127.0.0.1:4101/__test/posts?mode=success");
});

test("a Visitor searches, orders and clears results while preserving URL criteria and history", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/?page=2&category=web&sort=oldest");
  const search = page.getByRole("searchbox", { name: "جست‌وجوی مقاله‌ها" });
  const sort = page.getByRole("combobox", { name: "ترتیب نمایش" });
  await expect(search).toBeVisible();
  await search.fill("  ا  ");
  await search.press("Enter");
  await expect(page).toHaveURL(/\?search=.*sort=oldest&category=web$/);
  await expect(search).toHaveValue("ا");
  await expect(page.getByRole("article")).toHaveCount(10);
  await page.getByRole("link", { name: "صفحهٔ بعد" }).click();
  await expect(page).toHaveURL(/category=web&page=2$/);
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.reload();
  await expect(search).toHaveValue("ا");
  await page.getByRole("article").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/posts\/test-post-12$/);
  await page.goBack();
  await expect(page).toHaveURL(/category=web&page=2$/);
  await sort.selectOption("newest");
  await page.getByRole("button", { name: "جست‌وجو", exact: true }).click();
  await expect(page).toHaveURL(/\?search=.*category=web$/);
  await expect(page.getByRole("article")).toHaveCount(10);
  await page.goBack();
  await expect(page).toHaveURL(/sort=oldest&category=web&page=2$/);
  await expect(sort).toHaveValue("oldest");
  await page.goForward();
  await expect(sort).toHaveValue("newest");
  await page.getByRole("link", { name: "پاک‌کردن جست‌وجو" }).click();
  await expect(page).toHaveURL(/\?category=web$/);
  await expect(search).toHaveValue("");
  for (const width of [360, 390, 1280]) {
    if (width === 1280) await page.getByRole("button", { name: "فعال‌کردن حالت روشن" }).click();
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`search-${width}.png`), fullPage: true });
  }
});

test("search matches titles or content case-insensitively and normalizes unsafe URL inputs", async ({ page }) => {
  for (const [term, slug] of [["طراحی رابط برای همه", "test-post-5"], ["const title", "test-post-1"], ["NEXT.JS", "test-post-1"]]) {
    await page.goto(`/?${new URLSearchParams({ search: term })}`);
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("article").getByRole("link")).toHaveAttribute("href", `/posts/${slug}`);
  }
  await page.goto("/?search=a&search=b&sort=oldest&sort=newest&category=web&category=other&tag=x&tag=y&page=-1&author=ignored&limit=1");
  await expect(page).toHaveURL("http://127.0.0.1:3101/");
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page.getByRole("article")).toHaveCount(10);
  await page.goto("/?search=%20%20&category=%20&tag=%20&sort=invalid");
  await expect(page).toHaveURL("http://127.0.0.1:3101/");
  const term = '<svg onload="window.searchInjected=true"> & TypeScript + فارسی';
  await page.goto(`/?${new URLSearchParams({ search: term })}`);
  await expect(page.getByRole("searchbox")).toHaveValue(term);
  await expect(page.getByRole("main").getByRole("status")).toContainText("مقاله‌ای با این معیارها پیدا نشد.");
  await expect(page.locator("svg[onload]")).toHaveCount(0);
  expect(await page.evaluate(() => "searchInjected" in window)).toBe(false);
});

test("combined URL filters survive clearing search without adding taxonomy controls", async ({ page }) => {
  await page.goto(`/?${new URLSearchParams({ search: "ا", sort: "oldest", category: "web", tag: "programming" })}`);
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.getByRole("link", { name: "پاک‌کردن جست‌وجو" }).click();
  await expect(page).toHaveURL(/\?sort=oldest&category=web&tag=programming$/);
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.goto("/?category=Web");
  await expect(page.getByRole("main").getByRole("status")).toContainText("مقاله‌ای با این معیارها پیدا نشد.");
  await expect(page).toHaveURL(/category=Web$/);
});

test("query-aware loading, retry and out-of-range recovery retain criteria and distinguish empty results", async ({ page, request }) => {
  await page.goto(`/?${new URLSearchParams({ search: "ا", sort: "oldest", category: "web", page: "5" })}`);
  await expect(page.getByText("در این صفحه مقاله‌ای وجود ندارد.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "بازگشت به صفحهٔ اول" }).click();
  await expect(page).toHaveURL(/sort=oldest&category=web$/);
  await expect(page.getByRole("article")).toHaveCount(10);
  await request.post("http://127.0.0.1:4101/__test/posts?mode=error");
  await page.reload();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت مقاله‌ها ممکن نشد.");
  await expect(page.getByRole("searchbox")).toHaveValue("ا");
  await request.post("http://127.0.0.1:4101/__test/posts?mode=success");
  await page.getByRole("button", { name: "تلاش دوباره" }).click();
  await expect(page.getByRole("article")).toHaveCount(10);
  await expect(page).toHaveURL(/sort=oldest&category=web$/);
  await request.post("http://127.0.0.1:4101/__test/posts?mode=slow");
  await page.getByRole("searchbox").fill("const title");
  await page.getByRole("button", { name: "جست‌وجو", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("در حال دریافت مقاله‌ها…");
  await expect(page.getByRole("article")).toHaveCount(1);
  await request.post("http://127.0.0.1:4101/__test/posts?mode=success");
  await page.getByRole("searchbox").fill("واژه-ناموجود-برای-آزمون");
  await page.getByRole("button", { name: "جست‌وجو", exact: true }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("مقاله‌ای با این معیارها پیدا نشد.");
  await expect(page.getByText("هنوز مقاله‌ای منتشر نشده است.", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "مشاهدهٔ همهٔ مقاله‌ها" }).click();
  await expect(page).toHaveURL(/\?sort=oldest$/);
  await expect(page.getByRole("article")).toHaveCount(10);
  await request.post("http://127.0.0.1:4101/__test/posts?mode=empty");
  await page.reload();
  await expect(page.getByRole("main").getByRole("status")).toHaveText("هنوز مقاله‌ای منتشر نشده است.");
});
