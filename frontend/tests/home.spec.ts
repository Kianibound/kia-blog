import { expect, test } from "@playwright/test";

test("a Visitor sees the first Published Posts in an accessible Persian public shell", async ({ page }, testInfo) => {
  const backendRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).port === "4101") backendRequests.push(request.url());
  });
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  // Data is in the server-rendered HTML, rather than loaded from Nest by browser JS.
  expect(await response!.text()).toContain("راهنمای Next.js و معماری وب");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  const articles = page.getByRole("article");
  await expect(articles).toHaveCount(10);
  await expect(articles.first().getByRole("heading")).toHaveText("راهنمای Next.js و معماری وب");
  await expect(articles.nth(1).getByRole("heading")).toHaveText("عنوان <strong>مقاله</strong> باید متن بماند");
  await expect(articles.first()).toContainText("نیما کیانی");
  await expect(articles.first()).toContainText("۱ فروردین ۱۴۰۵");
  await expect(articles.first()).toContainText("توسعهٔ وب");
  await expect(articles.nth(1)).toContainText("nima");
  await expect(articles.nth(1).locator("time")).toHaveCount(0);
  await expect(articles.getByRole("link")).toHaveCount(10);
  await expect(articles.first().getByRole("link")).toHaveAttribute("href", "/posts/test-post-1");
  await expect(page.getByText("از درخواست تا صفحه", { exact: false })).toHaveCount(0);
  await expect(page.locator("main strong")).toHaveCount(0);
  expect(backendRequests).toEqual([]);

  // The first keyboard stop skips the shell; home navigation is also a real destination.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "رفتن به محتوای اصلی" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.getByRole("navigation", { name: "راهبری اصلی" }).getByRole("link", { name: "خانه", exact: true }).click();
  await expect(articles).toHaveCount(10);

  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(articles.first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`homepage-${width}.png`), fullPage: true });
  }
});

test("a Visitor operates the mobile navigation with the keyboard", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "راهبری اصلی" });
  const menu = navigation.getByRole("button", { name: "فهرست", exact: true });
  const home = navigation.getByRole("link", { name: "خانه", exact: true });
  const about = navigation.getByRole("link", { name: "درباره", exact: true });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(about).toBeHidden();
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(home).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(navigation.getByRole("button", { name: "دسته‌بندی‌ها" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(about).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("navigation-360.png") });
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  await expect(about).toBeHidden();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/about$/);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("دربارهٔ کیا بلاگ");
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`about-${width}.png`), fullPage: true });
  }
  await menu.click();
  await expect(about).toHaveAttribute("aria-current", "page");
  await home.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("article")).toHaveCount(10);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(menu).toBeHidden();
  await expect(home).toBeVisible();
  await expect(about).toBeVisible();
});

test("a Visitor navigates from the Hero to articles and between Home and About", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "مشاهدهٔ مقاله‌ها", exact: true }).click();
  await expect(page).toHaveURL(/#published-posts$/);
  await expect(page.getByRole("heading", { name: "آخرین مقاله‌ها", exact: true })).toBeInViewport();

  const navigation = page.getByRole("navigation", { name: "راهبری اصلی" });
  const home = navigation.getByRole("link", { name: "خانه", exact: true });
  const about = navigation.getByRole("link", { name: "درباره", exact: true });
  await expect(home).toHaveAttribute("aria-current", "page");
  const alignment = await navigation.evaluate((nav) => {
    const bounds = nav.getBoundingClientRect();
    const links = nav.querySelector("ul:not([id])")!.getBoundingClientRect();
    return Math.abs((bounds.left + bounds.right) / 2 - (links.left + links.right) / 2);
  });
  expect(alignment).toBeLessThan(1);
  await about.click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("دربارهٔ کیا بلاگ");
  await expect(about).toHaveAttribute("aria-current", "page");
  await expect(home).not.toHaveAttribute("aria-current", "page");
  // Direct requests must also serve the About content, not just client navigation.
  const response = await page.reload();
  expect(response?.status()).toBe(200);
  expect(await response!.text()).toContain("دربارهٔ کیا بلاگ");
  await page.screenshot({ path: testInfo.outputPath("about-desktop.png"), fullPage: true });
  await page.getByRole("link", { name: "بازگشت به مقاله‌ها", exact: true }).click();
  await expect(page).toHaveURL(/\/#published-posts$/);
  await expect(page.getByRole("article")).toHaveCount(10);
});
