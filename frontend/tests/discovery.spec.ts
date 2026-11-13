import { expect, test } from "@playwright/test";

test("search page queries the live feed, paginates and exposes canonical metadata", async ({ page }) => {
  await page.goto("/search?q=ا&sort=oldest");
  await expect(page).toHaveTitle(/جست‌وجوی مقاله‌ها/);
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/search\?q=/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  await page.goto("/search?q=zzz-no-match");
  await expect(page.getByText("مقاله‌ای با این عبارت پیدا نشد.", { exact: false })).toBeVisible();
});

test("category index links only routable slugs and the detail route lists published posts", async ({ page }) => {
  await page.goto("/categories");
  await expect(page.getByRole("heading", { level: 1, name: "دسته‌بندی‌ها", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "توسعهٔ وب", exact: true })).toHaveAttribute("href", "/categories/web");

  await page.goto("/categories/web");
  await expect(page.getByRole("heading", { level: 1, name: "توسعهٔ وب", exact: true })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page).toHaveTitle(/توسعهٔ وب/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/categories\/web$/);

  await page.locator('a[href="/categories/web?page=2"]').click();
  await expect(page).toHaveURL(/\/categories\/web\?page=2$/);

  await page.goto("/categories/missing-category");
  await expect(page.getByText("در این دسته‌بندی مقالهٔ منتشرشده‌ای وجود ندارد.", { exact: false })).toBeVisible();
});

test("tag index and tag detail route use the published tag slug", async ({ page }) => {
  await page.goto("/tags");
  await expect(page.getByRole("heading", { level: 1, name: "تگ‌ها", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "برنامه‌نویسی", exact: true })).toHaveAttribute("href", "/tags/programming");

  await page.goto("/tags/programming");
  await expect(page.getByRole("heading", { level: 1, name: "برنامه‌نویسی", exact: true })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/tags\/programming$/);
});

test("author page lists only that author's published posts", async ({ page }) => {
  await page.goto("/authors/nima");
  await expect(page.getByRole("heading", { level: 1, name: /مقاله‌های nima/ })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/authors\/nima$/);

  await page.goto("/authors/unknown_author");
  await expect(page.getByText("این نویسنده هنوز مقالهٔ منتشرشده‌ای ندارد.", { exact: false })).toBeVisible();
});

test("unsafe discovery segments return a real 404 instead of querying", async ({ page }) => {
  for (const path of ["/categories/UPPER", "/tags/bad%20slug", "/authors/no-dash"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
});
