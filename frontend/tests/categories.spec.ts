import { expect, test } from "@playwright/test";

test.afterEach(async ({ request }) => {
  await request.post("http://127.0.0.1:4101/__test/categories?mode=success");
});

test("a Visitor can disclose categories on desktop and mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "راهبری اصلی" });
  const categories = nav.getByRole("button", { name: "دسته‌بندی‌ها" });
  await categories.focus();
  await page.keyboard.press("Enter");
  await expect(categories).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByText("توسعهٔ وب", { exact: true }).locator("visible=true")).toBeVisible();
  await expect(nav.getByText("یادگیری ۲۰۲۶", { exact: true }).locator("visible=true")).toBeVisible();
  await expect(nav.getByRole("link", { name: "توسعهٔ وب" })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("categories-desktop.png") });
  await page.keyboard.press("Escape");
  await expect(categories).toHaveAttribute("aria-expanded", "false");
  await expect(categories).toBeFocused();
  await page.setViewportSize({ width: 360, height: 900 });
  await nav.getByRole("button", { name: "فهرست" }).click();
  await categories.click();
  await expect(nav.getByText("یادگیری ۲۰۲۶", { exact: true }).locator("visible=true")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("categories-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("empty or unavailable categories do not prevent public reading", async ({ page, request }) => {
  for (const [mode, message] of [["empty", "هنوز دسته‌بندی‌ای وجود ندارد."], ["error", "دسته‌بندی‌ها در دسترس نیستند."], ["invalid", "دسته‌بندی‌ها در دسترس نیستند."]]) {
    await request.post(`http://127.0.0.1:4101/__test/categories?mode=${mode}`);
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "راهبری اصلی" });
    await nav.getByRole("button", { name: "دسته‌بندی‌ها" }).click();
    await expect(nav.getByText(message, { exact: true }).locator("visible=true")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(10);
    await expect(nav.getByRole("link", { name: "درباره", exact: true })).toBeVisible();
  }
});

test("footer shows decorative social icons and links only valid configured destinations", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  const social = footer.getByRole("list", { name: "شبکه‌های اجتماعی" });
  await expect(social.locator("img")).toHaveCount(3);
  const github = social.getByRole("link", { name: "گیت‌هاب" });
  await expect(github).toHaveAttribute("href", "https://example.test/github");
  await expect(github).toHaveAttribute("rel", "noopener noreferrer");
  await expect(social.getByRole("link")).toHaveCount(1);
  await expect(social.locator("span[aria-hidden='true']")).toHaveCount(2);
});
