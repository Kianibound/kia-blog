import { expect, test } from "@playwright/test";

test("a Visitor validates labeled Contact fields by keyboard while delivery stays unavailable", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("تماس با ما");
  const name = page.getByRole("textbox", { name: "نام", exact: true });
  const email = page.getByRole("textbox", { name: "ایمیل", exact: true });
  const message = page.getByRole("textbox", { name: "پیام", exact: true });
  await name.focus();
  await name.fill("   ");
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription("نام خود را وارد کنید.");
  await email.fill("invalid-email");
  await page.keyboard.press("Tab");
  await expect(message).toBeFocused();
  await expect(email).toHaveAttribute("dir", "ltr");
  await expect(email).toHaveAccessibleDescription("یک آدرس ایمیل معتبر وارد کنید.");
  await email.fill("");
  await email.press("Tab");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await message.fill("   ");
  await page.keyboard.press("Tab");
  await expect(message).toHaveAccessibleDescription("پیام خود را بنویسید.");
  await expect(page.getByRole("button", { name: "ارسال پیام", exact: true })).toBeDisabled();

  // Observe the browser boundary after navigation: drafts must never leave this page.
  const requests: string[] = [];
  const logs: string[] = [];
  page.on("request", (request) => {
    if (!["image", "font", "stylesheet", "script"].includes(request.resourceType())) requests.push(request.url());
  });
  page.on("console", (entry) => logs.push(entry.text()));
  await name.fill("کاربر آزمایشی");
  await email.fill("visitor@example.test");
  await message.fill("این یک پیام آزمایشی است.");
  await page.keyboard.press("Tab");
  for (const field of [name, email, message]) {
    await expect(field).not.toHaveAttribute("aria-invalid", "true");
  }
  await email.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("ارسال پیام هنوز فعال نیست. در حال حاضر نمی‌توانید از این فرم پیامی بفرستید.");
  await expect(message).toHaveValue("این یک پیام آزمایشی است.");
  await expect(page.getByRole("button", { name: "ارسال پیام", exact: true })).toBeDisabled();
  await expect(page.getByText(/با موفقیت|ارسال شد/)).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(logs.join(" ")).not.toMatch(/visitor@example.test|کاربر آزمایشی|این یک پیام آزمایشی/);
  const storage = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]));
  expect(storage).not.toMatch(/visitor@example.test|کاربر آزمایشی|این یک پیام آزمایشی/);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a Visitor sees unavailable delivery and cannot send a draft", async ({ page }) => {
    const response = await page.goto("/contact");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("status")).toHaveText("ارسال پیام هنوز فعال نیست. در حال حاضر نمی‌توانید از این فرم پیامی بفرستید.");
    await page.getByRole("textbox", { name: "نام", exact: true }).fill("کاربر آزمایشی");
    const email = page.getByRole("textbox", { name: "ایمیل", exact: true });
    await email.fill("visitor@example.test");
    await page.getByRole("textbox", { name: "پیام", exact: true }).fill("پیام آزمایشی");
    await expect(page.getByRole("button", { name: "ارسال پیام", exact: true })).toBeDisabled();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (!["image", "font", "stylesheet", "script"].includes(request.resourceType())) requests.push(request.url());
    });
    await email.press("Enter");
    await expect(page.getByRole("textbox", { name: "پیام", exact: true })).toHaveValue("پیام آزمایشی");
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByText(/با موفقیت|ارسال شد/)).toHaveCount(0);
    expect(requests).toEqual([]);
  });
});

test("a Visitor reaches Contact from desktop and mobile navigation", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "راهبری اصلی" });
  const contact = navigation.getByRole("link", { name: "تماس", exact: true });
  const home = navigation.getByRole("link", { name: "خانه", exact: true });
  await contact.click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(contact).toHaveAttribute("aria-current", "page");
  await expect(home).not.toHaveAttribute("aria-current", "page");
  const response = await page.reload();
  expect(response?.status()).toBe(200);
  expect(await response!.text()).toContain("تماس با ما");

  for (const mode of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await expect(page.locator("html")).toHaveCSS("color-scheme", mode);
    for (const width of [360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole("textbox", { name: "نام", exact: true }).focus();
      await page.screenshot({ path: testInfo.outputPath(`contact-${mode}-${width}.png`), fullPage: true });
    }
  }
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/");
  const menu = navigation.getByRole("button", { name: "فهرست", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  for (let step = 0; step < 4; step++) await page.keyboard.press("Tab");
  await expect(contact).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/contact$/);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(contact).toHaveAttribute("aria-current", "page");
  await expect(home).not.toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "نام", exact: true })).toBeFocused();
});
