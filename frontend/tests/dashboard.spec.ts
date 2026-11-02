import { expect, test } from "@playwright/test";
import { parseArticleDetail, parseArticleWrite } from "../src/lib/article-form-contract";

test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?reset=1");
});

test("an Author explicitly creates a fixture draft and edits plain content with persisted taxonomy", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts");
  await page.getByRole("link", { name: "ایجاد مقالهٔ آزمایشی" }).click();
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page.getByText("عنوان مقاله را وارد کنید.", { exact: true })).toBeVisible();
  await expect(page.getByText("متن مقاله را وارد کنید.", { exact: true })).toBeVisible();
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("پیش‌نویس تازه");
  await page.getByLabel("متن مقاله", { exact: true }).fill("متن ساده <strong>بدون تبدیل</strong>\nخط دوم");
  await page.getByRole("checkbox", { name: "توسعهٔ وب" }).check();
  await page.getByRole("checkbox", { name: "برنامه‌نویسی" }).check();
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await expect(page).toHaveURL(/\/dashboard\/posts\/[^/]+\/edit$/);
  await page.getByRole("link", { name: "بازگشت به مقاله‌های من" }).click();
  const row = page.getByRole("listitem").filter({ hasText: "پیش‌نویس تازه" });
  await expect(row).toContainText("پیش‌نویس");
  await row.getByRole("link", { name: "ویرایش مقاله" }).click();
  await expect(page.getByLabel("متن مقاله", { exact: true })).toHaveValue("متن ساده <strong>بدون تبدیل</strong>\nخط دوم");
  await expect(page.getByRole("checkbox", { name: "توسعهٔ وب" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "برنامه‌نویسی" })).toBeChecked();
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("عنوان ویرایش‌شده");
  await page.getByRole("checkbox", { name: "برنامه‌نویسی" }).uncheck();
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page.reload();
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveValue("عنوان ویرایش‌شده");
  await expect(page.getByRole("checkbox", { name: "برنامه‌نویسی" })).not.toBeChecked();
});

test("an Author recovers missing taxonomy choices and failed reads without losing selected relations", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&formMode=missing");
  const edit = "/dashboard/posts/00000000-0000-4000-8000-000000000001/edit";
  await page.goto(edit);
  const category = page.getByRole("checkbox", { name: "توسعهٔ وب" });
  await expect(category).toBeChecked();
  await category.uncheck();
  await expect(category).toBeVisible();
  await category.check();
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page.reload();
  await expect(category).toBeChecked();
  for (const mode of ["error", "invalid", "detail-error"]) {
    await request.post(`http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&formMode=${mode}`);
    await page.goto(edit);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت مقاله یا گزینه‌های آن ممکن نشد.");
    await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
    await page.getByRole("button", { name: "تلاش دوباره" }).click();
    await expect(category).toBeChecked();
  }
});

test("fixture saves are explicit, prevent duplicate submission and preserve inputs on failed or uncertain writes", async ({ page, request }) => {
  const control = "http://127.0.0.1:4101/__test/dashboard?role=AUTHOR";
  const writes = async () => (await (await request.get("http://127.0.0.1:4101/__test/dashboard-writes")).json()).writes;
  await request.post(`${control}&saveMode=error`);
  await page.goto("/dashboard/posts/new");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("حفظ ورودی‌ها");
  await page.getByLabel("متن مقاله", { exact: true }).fill("متن حفظ می‌شود.");
  await page.getByRole("checkbox", { name: "یادگیری ۲۰۲۶" }).check();
  expect(await writes()).toBe(0);
  const save = page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true });
  await save.click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("ذخیره انجام نشد.");
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveValue("حفظ ورودی‌ها");
  await expect(page.getByLabel("متن مقاله", { exact: true })).toHaveValue("متن حفظ می‌شود.");
  await expect(page.getByRole("checkbox", { name: "یادگیری ۲۰۲۶" })).toBeChecked();
  await request.post(`${control}&saveMode=slow`);
  await save.dblclick();
  await expect(page.getByRole("button", { name: "در حال ذخیره…" })).toBeDisabled();
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  expect(await writes()).toBe(2);
  await request.post(`${control}&saveMode=uncertain`);
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("نتیجهٔ نامشخص");
  await save.click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("نتیجهٔ ذخیره مشخص نیست.");
  await expect(save).toBeDisabled();
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveValue("نتیجهٔ نامشخص");
  expect(await writes()).toBe(3);
  await page.getByRole("link", { name: "بازگشت به مقاله‌های من" }).click();
  const row = page.getByRole("listitem").filter({ hasText: "نتیجهٔ نامشخص" });
  await row.getByRole("link", { name: "ویرایش مقاله" }).click();
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveValue("نتیجهٔ نامشخص");
});

test("fixture HTTP contracts keep detail/write responses distinct and reset list/detail together", async ({ request }) => {
  const base = "http://127.0.0.1:4101";
  await request.post(`${base}/__test/dashboard?role=AUTHOR`);
  const input = { title: "قرارداد آزمایشی", content: "متن ساده\nبدون JSON", categoryIds: ["20000000-0000-4000-8000-000000000001"], tagIds: ["40000000-0000-4000-8000-000000000001"] };
  const response = await request.post(`${base}/dashboard-posts`, { data: input });
  expect(response.status()).toBe(201);
  const payload = await response.json();
  const saved = parseArticleWrite(payload);
  expect(saved).toMatchObject({ title: input.title, content: input.content, status: "DRAFT", publishedAt: null });
  expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(saved.slug).toMatch(/^fixture-draft-/);
  expect(payload).not.toHaveProperty("author");
  expect(payload.categories[0]).toHaveProperty("createdAt");
  expect(() => parseArticleDetail(payload)).toThrow();
  const detail = await (await request.get(`${base}/dashboard-posts/${saved.id}`)).json();
  expect(parseArticleDetail(detail)).toEqual(saved);
  expect(detail.categories[0]).not.toHaveProperty("createdAt");
  expect(() => parseArticleWrite(detail)).toThrow();
  for (const invalid of [{ ...detail, content: {} }, { ...detail, author: { ...detail.author, id: "other" } }, { ...detail, categories: null }]) expect(() => parseArticleDetail(invalid)).toThrow();
  const list = await (await request.get(`${base}/dashboard-posts?page=1&limit=10`)).json();
  expect(list.data[0]).toMatchObject({ id: saved.id, slug: saved.slug, title: input.title });
  expect(list.data[0]).not.toHaveProperty("categories");
  expect((await request.patch(`${base}/dashboard-posts/${saved.id}`, { data: { ...input, status: "PUBLISHED" } })).status()).toBe(400);
  await request.post(`${base}/__test/dashboard?role=AUTHOR&reset=1`);
  expect((await request.get(`${base}/dashboard-posts/${saved.id}`)).status()).toBe(404);
  expect((await (await request.get(`${base}/dashboard-posts?page=1&limit=10`)).json()).meta.total).toBe(11);
});

test("article forms remain accessible on mobile and saving is unavailable without the preview adapter", async ({ page, request }, testInfo) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard/posts/new");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    for (const theme of ["light", "dark"]) {
      const toggle = page.getByRole("button", { name: theme === "light" ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تاریک" });
      await toggle.click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByLabel("عنوان مقاله", { exact: true }).focus();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("متن مقاله", { exact: true })).toBeFocused();
      await page.screenshot({ path: testInfo.outputPath(`article-form-${width}-${theme}.png`), fullPage: true });
    }
  }
  await page.goto("/dashboard/posts/unavailable");
  await expect(page.getByText("ذخیرهٔ واقعی تا اتصال امن به سامانه در دسترس نیست.")).toBeVisible();
  await expect(page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true })).toBeDisabled();
  expect((await (await request.get("http://127.0.0.1:4101/__test/dashboard-writes")).json()).writes).toBe(0);
  for (const role of ["USER", "ADMIN"]) {
    await request.post(`http://127.0.0.1:4101/__test/dashboard?role=${role}`);
    await page.goto("/dashboard/posts/new");
    await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveCount(0);
  }
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
  await expect(page.getByRole("main").getByRole("link", { name: /حذف|انتشار/ })).toHaveCount(0);
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
