import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard");
});

test("an Author browses only their own Posts with persisted pagination and no premature actions", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts");
  await expect(page.getByRole("heading", { level: 1, name: "مقاله‌های من" })).toBeVisible();
  await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(10);
  await expect(page.getByRole("main")).toContainText("پیش‌نویس");
  await expect(page.getByRole("main")).toContainText("منتشرشده");
  await expect(page.getByRole("main")).toContainText("کنارگذاشته‌شده");
  await page.getByRole("link", { name: "صفحهٔ بعد" }).click();
  await expect(page).toHaveURL(/\/dashboard\/posts\?page=2$/);
  await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("main")).toContainText("صفحهٔ ۲ از ۲");
  await expect(page.getByRole("main").getByRole("link", { name: /ویرایش|ایجاد|حذف|انتشار/ })).toHaveCount(0);
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&author=nima");
  await page.goto("/dashboard/posts");
  await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("main")).toContainText("پایان این مجموعه");
  await expect(page.getByRole("main")).not.toContainText("راهنمای Next.js");
});

test("own-Post loading, empty, invalid and failed reads recover at the selected page", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&postsMode=slow");
  await page.goto("/dashboard/posts", { waitUntil: "commit" });
  await expect(page.getByRole("status")).toHaveText("در حال دریافت مقاله‌های شما…");
  await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(10);
  for (const mode of ["error", "invalid", "foreign"]) {
    await request.post(`http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&postsMode=${mode}`);
    await page.goto("/dashboard/posts?page=2");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت مقاله‌های شما ممکن نشد.");
    await expect(page.getByRole("list", { name: "مقاله‌های من" })).toHaveCount(0);
    await expect(page.getByRole("main")).not.toContainText("TEST DOUBLE");
  }
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.getByRole("button", { name: "تلاش دوباره" }).click();
  await expect(page).toHaveURL(/page=2$/);
  await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(1);
  for (const mode of ["error", "invalid"]) {
    await request.post(`http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&mode=${mode}`);
    await page.goto("/dashboard/posts?page=2");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت مقاله‌های شما ممکن نشد.");
    await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
    await page.getByRole("button", { name: "تلاش دوباره" }).click();
    await expect(page).toHaveURL(/page=2$/);
    await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(1);
  }
  await page.goto("/dashboard/posts?page=999");
  await expect(page.getByRole("status")).toHaveText("در این صفحه مقاله‌ای وجود ندارد.");
  await page.getByRole("link", { name: "بازگشت به صفحهٔ اول" }).click();
  await expect(page).toHaveURL(/\/dashboard\/posts$/);
  for (const query of ["page=-1", "page=2&page=3", "page=9007199254740992"]) {
    await page.goto(`/dashboard/posts?${query}`);
    await expect(page.getByRole("main")).toContainText("صفحهٔ ۱ از ۲");
  }
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&postsMode=empty");
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("هنوز مقاله‌ای ندارید.");
  await expect(page.getByRole("navigation", { name: "صفحه‌بندی مقاله‌های من" })).toHaveCount(0);
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=USER");
  await page.goto("/dashboard/posts");
  await expect(page.getByRole("list", { name: "مقاله‌های من" })).toHaveCount(0);
});

test("author list remains readable and keyboard-paginated on mobile in both themes", async ({ page, request }, testInfo) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard/posts");
    await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("heading", { name: "عنوان <strong>مقاله</strong> باید متن بماند" })).toBeVisible();
    for (const theme of ["light", "dark"]) {
      await page.getByRole("button", { name: theme === "light" ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تاریک" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.screenshot({ path: testInfo.outputPath(`author-posts-${theme}-${width}.png`), fullPage: true });
    }
    const next = page.getByRole("link", { name: "صفحهٔ بعد" });
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/page=2$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/posts$/);
  }
});

test("each fixture Role gets an honest RTL dashboard with working role navigation", async ({ page, request }) => {
  for (const [role, name, label] of [
    ["USER", "نرگس رضایی", "فضای خواندن"],
    ["AUTHOR", "سارا کیانی", "فضای نویسندگی"],
    ["ADMIN", "مدیر نمونه", "فضای مدیریت"],
  ]) {
    await request.post(`http://127.0.0.1:4101/__test/dashboard?role=${role}`);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "پیشخوان" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("note")).toContainText("داده‌های آزمایشی");
    await expect(page.getByRole("group", { name: "هویت حساب" })).toContainText(name);
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/workspace$/);
    await expect(page.getByRole("heading", { level: 1, name: label })).toBeVisible();
    await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    await page.reload();
    await expect(page.getByRole("group", { name: "هویت حساب" })).toContainText(name);
    await expect(page.getByRole("button", { name: "خروج", exact: true })).toHaveCount(0);
  }
});

test("loading and unavailable identity preserve preview context and offer a fresh retry", async ({ page, request }) => {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await request.post("http://127.0.0.1:4101/__test/dashboard?mode=slow");
    await page.goto("/dashboard", { waitUntil: "commit" });
    await expect(page.getByRole("status")).toHaveText("در حال دریافت پیشخوان…");
    await expect(page.getByRole("note")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const loadingContent = await page.getByRole("main").boundingBox();
    await expect(page.getByRole("group", { name: "هویت حساب" })).toContainText("نرگس رضایی");
    const loadedContent = await page.getByRole("main").boundingBox();
    expect(Math.abs(loadedContent!.y - loadingContent!.y)).toBeLessThanOrEqual(1);
  }
  for (const mode of ["error", "invalid"]) {
    await request.post(`http://127.0.0.1:4101/__test/dashboard?mode=${mode}`);
    await page.goto("/dashboard/workspace");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت اطلاعات پیشخوان ممکن نشد.");
    await expect(page.getByRole("group", { name: "هویت حساب" })).not.toContainText("نرگس رضایی");
    await expect(page.getByRole("note")).toBeVisible();
    await expect(page.getByRole("main")).not.toContainText("TEST DOUBLE");
  }
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.getByRole("button", { name: "تلاش دوباره" }).click();
  await expect(page).toHaveURL(/\/dashboard\/workspace$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("فضای نویسندگی");
});

test("mobile navigation, skip link, theme persistence and return-to-blog work with a keyboard", async ({ page, request }, testInfo) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/dashboard");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "رفتن به محتوای پیشخوان" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  const menu = page.getByRole("button", { name: "فهرست پیشخوان", exact: true });
  const workspace = page.getByRole("link", { name: "فضای نویسندگی", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(workspace).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Space");
  await workspace.click();
  await expect(page).toHaveURL(/\/dashboard\/workspace$/);
  await expect(menu).toHaveAttribute("aria-expanded", "false");

  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    if (width < 1024) await menu.click();
    else await expect(menu).toBeHidden();
    await expect(workspace).toBeVisible();
    for (const control of await page.getByRole("navigation", { name: "راهبری پیشخوان" }).locator("a:visible, button:visible").all()) {
      const bounds = await control.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const darkBackground = await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor);
    await page.getByRole("button", { name: "فعال‌کردن حالت روشن" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor)).not.toBe(darkBackground);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.screenshot({ path: testInfo.outputPath(`dashboard-light-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "فعال‌کردن حالت تاریک" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.screenshot({ path: testInfo.outputPath(`dashboard-dark-${width}.png`), fullPage: true });
  }
  await page.getByRole("link", { name: "بازگشت به وبلاگ" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("article").first()).toBeVisible();
});
