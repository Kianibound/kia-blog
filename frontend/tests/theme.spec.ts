import { expect, test } from "@playwright/test";

test("a Visitor keeps an explicit theme across navigation and reloads", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "حالت روشن", exact: true });
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.locator('nav a[href="/about"]').click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.goto("/");
  for (const mode of ["light", "dark"] as const) {
    if (mode === "dark") await toggle.click();
    await expect(page.locator("html")).toHaveCSS("color-scheme", mode);
    await page.keyboard.press("Tab");
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`focus-${mode}.png`) });
    for (const width of [360, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(toggle).toBeVisible();
      await expect(page.getByRole("article")).toHaveCount(10);
      await page.screenshot({ path: testInfo.outputPath(`homepage-${mode}-${width}.png`), fullPage: true });
    }
  }
  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  expect(errors).toEqual([]);
});

test("a Visitor without a saved preference follows the system color scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "حالت روشن", exact: true });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

test("a Visitor can switch themes when browser storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() { throw new DOMException("Storage unavailable", "SecurityError"); },
    });
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "حالت روشن", exact: true });
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect(page.getByRole("article")).toHaveCount(10);
});

test("a Visitor ignores an invalid saved theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("kia-blog-theme", "invalid"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "حالت روشن", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});
