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
  await expect(articles.locator("a")).toHaveCount(0);
  await expect(page.getByText("TEST DOUBLE BODY", { exact: false })).toHaveCount(0);
  await expect(page.locator("main strong")).toHaveCount(0);
  expect(backendRequests).toEqual([]);

  // The first keyboard stop skips the shell; home navigation is also a real destination.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "رفتن به محتوای اصلی" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.getByRole("navigation").getByRole("link", { name: "خانه", exact: true }).click();
  await expect(articles).toHaveCount(10);

  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(articles.first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`homepage-${width}.png`), fullPage: true });
  }
});
