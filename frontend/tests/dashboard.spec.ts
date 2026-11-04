import { expect, test } from "@playwright/test";
import { parseArticleDetail, parseArticleWrite } from "../src/lib/article-form-contract";

test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?reset=1");
});

test("article images survive save, reload and published reading without losing text", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts/new");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("مقالهٔ تصویری");
  const text = page.getByRole("textbox", { name: "متن مقاله", exact: true });
  await text.fill("متن پیش از تصویر");
  await text.press("End");
  await page.getByRole("checkbox", { name: "توسعهٔ وب" }).check();
  await page.getByRole("button", { name: "افزودن تصویر", exact: true }).click();
  await page.getByLabel("فایل تصویر", { exact: true }).setInputFiles("public/social/linkedin.png");
  await page.getByLabel("متن جایگزین تصویر", { exact: true }).fill("نشان لینکدین");
  await page.getByRole("button", { name: "درج تصویر", exact: true }).click();
  const image = page.getByRole("img", { name: "نشان لینکدین", exact: true });
  await expect(image).toHaveAttribute("src", /^\/fixture-images\/[a-f0-9-]+$/);
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(text).toContainText("متن پیش از تصویر");
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await page.reload();
  await expect(image).toBeVisible();
  await expect(text).toContainText("متن پیش از تصویر");
  await page.getByRole("button", { name: "انتشار مقاله", exact: true }).click();
  await page.getByRole("button", { name: "تأیید انتشار آزمایشی", exact: true }).click();
  await page.getByRole("link", { name: "مشاهده در خواندن آزمایشی", exact: true }).click();
  await expect(image).toBeVisible();
  await expect(page.getByRole("document", { name: "متن مقاله", exact: true })).toContainText("متن پیش از تصویر");
});

test("article images support validation, retry, cancel and removal on mobile and desktop", async ({ page, request }, testInfo) => {
  test.setTimeout(60000);
  const control = "http://127.0.0.1:4101/__test/dashboard?role=AUTHOR";
  await request.post(control);
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard/posts/new");
    const text = page.getByRole("textbox", { name: "متن مقاله", exact: true });
    const save = page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true });
    const add = page.getByRole("button", { name: "افزودن تصویر", exact: true });
    await page.getByLabel("عنوان مقاله", { exact: true }).fill("تصویر آزمایشی");
    await text.fill("متن حفظ‌شده");
    await add.click();
    await expect(save).toBeDisabled();
    await page.getByRole("button", { name: "درج تصویر", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("فایل تصویر و متن جایگزین را وارد کنید.");
    const file = page.getByLabel("فایل تصویر", { exact: true });
    await file.setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("test double") });
    await page.getByLabel("متن جایگزین تصویر", { exact: true }).fill("تصویر انتخابی");
    await page.getByRole("button", { name: "درج تصویر", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("یک فایل PNG، JPEG یا WebP غیرخالی تا ۵ مگابایت انتخاب کنید.");
    await file.setInputFiles("public/social/linkedin.png");
    await request.post(`${control}&imageMode=error`);
    await page.getByRole("button", { name: "درج تصویر", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("بارگذاری تصویر ممکن نشد.");
    await expect(save).toBeDisabled();
    await expect(page.getByLabel("متن جایگزین تصویر", { exact: true })).toHaveValue("تصویر انتخابی");
    await request.post(`${control}&imageMode=slow`);
    await page.getByRole("button", { name: "تلاش دوباره برای تصویر", exact: true }).click();
    await expect(page.getByRole("status", { name: "" }).filter({ hasText: "در حال بارگذاری تصویر…" })).toBeVisible();
    await page.getByRole("button", { name: "انصراف از تصویر", exact: true }).click();
    await expect(save).toBeEnabled();
    await expect(page.locator(".rich-editor img")).toHaveCount(0);
    await request.post(control);
    await add.click();
    await file.setInputFiles("public/social/linkedin.png");
    await page.getByLabel("متن جایگزین تصویر", { exact: true }).fill("تصویر نهایی");
    await request.post(`${control}&imageMode=error`);
    await page.getByRole("button", { name: "درج تصویر", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("بارگذاری تصویر ممکن نشد.");
    await request.post(control);
    await page.getByRole("button", { name: "تلاش دوباره برای تصویر", exact: true }).click();
    const image = page.getByRole("img", { name: "تصویر نهایی", exact: true });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`article-image-${width}.png`), fullPage: true });
    await image.click();
    await page.getByRole("button", { name: "حذف تصویر انتخاب‌شده", exact: true }).click();
    await expect(page.locator(".rich-editor img")).toHaveCount(0);
    await expect(text).toContainText("متن حفظ‌شده");
    await save.click();
    await expect(page).toHaveURL(/\/edit$/);
    await page.reload();
    await expect(page.locator(".rich-editor img")).toHaveCount(0);
    await expect(text).toContainText("متن حفظ‌شده");
  }
  for (const role of ["USER", "ADMIN"]) {
    await request.post(`http://127.0.0.1:4101/__test/dashboard?role=${role}`);
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/dashboard/posts/new");
      await expect(page.getByRole("button", { name: "افزودن تصویر", exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test("image fixture rejects transient and unknown image references", async ({ request }) => {
  const base = "http://127.0.0.1:4101";
  await request.post(`${base}/__test/dashboard?role=AUTHOR`);
  for (const src of ["blob:http://127.0.0.1/image", "data:image/png;base64,AAAA", "/fixture-images/missing"]) {
    const response = await request.post(`${base}/dashboard-posts`, { data: { title: "تصویر", content: "متن", categoryIds: [], tagIds: [], previewDocument: { format: "tiptap-ui-proposal-1", document: { type: "doc", content: [{ type: "image", attrs: { src, alt: "تصویر" } }] } } } });
    expect(response.status()).toBe(400);
  }
});

test("Author status filters restore selection and results through URLs and history", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts?page=2");
  const filters = page.getByRole("navigation", { name: "وضعیت مقاله‌ها" });
  const rows = page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem");
  const draft = filters.getByRole("link", { name: "پیش‌نویس", exact: true });
  await draft.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/dashboard/posts?status=DRAFT");
  await expect(draft).toHaveAttribute("aria-current", "page");
  await expect(rows).toHaveCount(4);
  await expect(rows.filter({ hasText: "منتشرشده" })).toHaveCount(0);
  await expect(rows.filter({ hasText: "کنارگذاشته‌شده" })).toHaveCount(0);
  await page.reload();
  await expect(draft).toHaveAttribute("aria-current", "page");
  await expect(rows).toHaveCount(4);
  await filters.getByRole("link", { name: "منتشرشده", exact: true }).click();
  await expect(page).toHaveURL("/dashboard/posts?status=PUBLISHED");
  await expect(rows).toHaveCount(4);
  await expect(rows.filter({ hasText: "پیش‌نویس" })).toHaveCount(0);
  await page.goBack();
  await expect(draft).toHaveAttribute("aria-current", "page");
  await page.goForward();
  await expect(filters.getByRole("link", { name: "منتشرشده", exact: true })).toHaveAttribute("aria-current", "page");
  await filters.getByRole("link", { name: "همه", exact: true }).click();
  await expect(page).toHaveURL("/dashboard/posts");
  await expect(rows).toHaveCount(10);
  await expect(rows.filter({ hasText: "کنارگذاشته‌شده" })).toHaveCount(3);
  for (const query of ["status=DEPRECATED", "status=unknown", "status=DRAFT&status=PUBLISHED"]) {
    await page.goto(`/dashboard/posts?${query}`);
    await expect(filters.getByRole("link", { name: "همه", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(rows).toHaveCount(10);
  }
});

test("Author status filters paginate filtered records and preserve selection through recovery", async ({ page, request }) => {
  const control = "http://127.0.0.1:4101/__test/dashboard?role=AUTHOR";
  await request.post(control);
  // Test-only drafts use the existing fixture write seam to span two filtered pages.
  for (let index = 0; index < 7; index++) {
    const response = await request.post("http://127.0.0.1:4101/dashboard-posts", { data: { title: `پیش‌نویس آزمایشی ${index}`, content: "متن آزمایشی", categoryIds: [], tagIds: [] } });
    expect(response.status()).toBe(201);
  }
  const filtered = await (await request.get("http://127.0.0.1:4101/dashboard-posts?page=2&limit=10&status=DRAFT")).json();
  expect(filtered.meta).toEqual({ page: 2, limit: 10, total: 11, totalPages: 2 });
  expect(filtered.data).toHaveLength(1);
  expect(filtered.data[0].status).toBe("DRAFT");
  const rows = page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem");
  await page.goto("/dashboard/posts?status=DRAFT");
  await expect(rows).toHaveCount(10);
  await page.getByRole("link", { name: "صفحهٔ بعد" }).click();
  await expect(page).toHaveURL("/dashboard/posts?page=2&status=DRAFT");
  await expect(rows).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("main")).toContainText("صفحهٔ ۲ از ۲");
  await page.getByRole("link", { name: "صفحهٔ قبل" }).click();
  await expect(page).toHaveURL("/dashboard/posts?status=DRAFT");
  await page.goBack();
  await expect(rows).toHaveCount(1);
  await page.getByRole("navigation", { name: "وضعیت مقاله‌ها" }).getByRole("link", { name: "منتشرشده", exact: true }).click();
  await expect(page).toHaveURL("/dashboard/posts?status=PUBLISHED");
  await expect(rows).toHaveCount(4);
  await page.goto("/dashboard/posts?page=999&status=DRAFT");
  await expect(page.getByRole("status")).toHaveText("در این صفحه مقاله‌ای وجود ندارد.");
  await page.getByRole("link", { name: "بازگشت به صفحهٔ اول" }).click();
  await expect(page).toHaveURL("/dashboard/posts?status=DRAFT");
  await expect(rows).toHaveCount(10);
  for (const failure of ["postsMode=error", "postsMode=invalid", "postsMode=foreign", "mode=error"]) {
    await request.post(`${control}&${failure}`);
    await page.goto("/dashboard/posts?page=2&status=DRAFT");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("دریافت مقاله‌های شما ممکن نشد.");
    await request.post(control);
    await page.getByRole("button", { name: "تلاش دوباره" }).click();
    await expect(page).toHaveURL("/dashboard/posts?page=2&status=DRAFT");
    await expect(rows).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "وضعیت مقاله‌ها" }).getByRole("link", { name: "پیش‌نویس", exact: true })).toHaveAttribute("aria-current", "page");
  }
});

test("Author status filters remain available during loading and distinguish an empty status", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&postsMode=slow");
  await page.goto("/dashboard/posts?status=PUBLISHED", { waitUntil: "commit" });
  await expect(page.getByRole("status")).toHaveText("در حال دریافت مقاله‌های شما…");
  const filters = page.getByRole("navigation", { name: "وضعیت مقاله‌ها" });
  await expect(filters.getByRole("link", { name: "منتشرشده", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(4);
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR&author=nima");
  await page.goto("/dashboard/posts?status=DRAFT");
  await expect(page.getByRole("status")).toHaveText("مقاله‌ای با این وضعیت ندارید.");
  await expect(page.getByRole("navigation", { name: "صفحه‌بندی مقاله‌های من" })).toHaveCount(0);
  await filters.getByRole("link", { name: "همه", exact: true }).click();
  await expect(page.getByRole("list", { name: "مقاله‌های من" }).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("main")).toContainText("کنارگذاشته‌شده");
  for (const query of ["status=DEPRECATED", "status=DRAFT&status=PUBLISHED"]) {
    expect((await request.get(`http://127.0.0.1:4101/dashboard-posts?page=1&limit=10&${query}`)).status()).toBe(400);
  }
});

test("an Author starts a new article and browses own articles from the workspace", async ({ page, request }, testInfo) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard/workspace");
    const main = page.getByRole("main");
    const create = main.getByRole("link", { name: "مقاله جدید", exact: true });
    const posts = main.getByRole("link", { name: "مقاله‌های من", exact: true });
    await expect(create).toBeVisible();
    await expect(posts).toBeVisible();
    for (const theme of ["light", "dark"]) {
      await page.getByRole("button", { name: theme === "light" ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تاریک" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const link of [create, posts]) {
        const bounds = await link.boundingBox();
        expect(bounds!.width).toBeGreaterThanOrEqual(44);
        expect(bounds!.height).toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`author-workspace-${theme}-${width}.png`), fullPage: true });
    }
    await create.focus();
    await expect(create).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/dashboard\/posts\/new$/);
    await expect(page.getByLabel("عنوان مقاله", { exact: true })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/workspace$/);
    await create.focus();
    await page.keyboard.press("Tab");
    await expect(posts).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/dashboard\/posts$/);
    await expect(page.getByRole("heading", { level: 1, name: "مقاله‌های من" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "راهنمای Next.js" })).toBeVisible();
  }
  for (const role of ["USER", "ADMIN"]) {
    await request.post(`http://127.0.0.1:4101/__test/dashboard?role=${role}`);
    await page.goto("/dashboard/workspace");
    await expect(page.getByRole("main").getByRole("link", { name: "مقاله جدید", exact: true })).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("link", { name: "مقاله‌های من", exact: true })).toHaveCount(0);
  }
});

test("publication actions share an RTL row and use a centered keyboard-accessible confirmation modal", async ({ page, request }, testInfo) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts/new");
  const save = page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true });
  const publish = page.getByRole("button", { name: "انتشار مقاله", exact: true });
  await expect(publish).toBeVisible();
  await expect(publish).toBeDisabled();
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("مقاله برای تأیید انتشار");
  await page.getByRole("textbox", { name: "متن مقاله", exact: true }).fill("محتوای حفظ‌شده");
  await page.getByRole("checkbox", { name: "توسعهٔ وب" }).check();
  await expect(publish).toBeDisabled();
  await save.click();
  await expect(publish).toBeEnabled();
  const actions = page.getByRole("group", { name: "عملیات مقاله" });
  const modal = page.getByRole("dialog", { name: "تأیید تغییر وضعیت" });
  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(actions.getByRole("button")).toHaveCount(2);
    const saveBox = await save.boundingBox();
    const publishBox = await publish.boundingBox();
    expect(publishBox!.x + publishBox!.width).toBeLessThanOrEqual(saveBox!.x);
    expect(Math.abs(publishBox!.y - saveBox!.y)).toBeLessThanOrEqual(1);
    await publish.click();
    await expect(modal).toHaveAttribute("aria-modal", "true");
    const confirm = modal.getByRole("button", { name: "تأیید انتشار آزمایشی", exact: true });
    const cancel = modal.getByRole("button", { name: "انصراف", exact: true });
    await expect(confirm).toBeFocused();
    const panel = await modal.boundingBox();
    expect(Math.abs(panel!.x + panel!.width / 2 - width / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs(panel!.y + panel!.height / 2 - 450)).toBeLessThanOrEqual(2);
    await page.keyboard.press("Tab");
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(modal.getByRole("button", { name: "بستن", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirm).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(modal.getByRole("button", { name: "بستن", exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(cancel).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`publication-modal-${width}.png`), fullPage: true });
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(publish).toBeFocused();
    await expect(page.getByRole("region", { name: "وضعیت انتشار آزمایشی" })).toContainText("پیش‌نویس");
  }
  await publish.click();
  await modal.getByRole("button", { name: "بستن", exact: true }).click();
  await expect(modal).toBeHidden();
  await expect(publish).toBeFocused();
  await publish.click();
  await page.mouse.click(4, 4);
  await expect(modal).toBeHidden();
  await expect(publish).toBeFocused();
  await publish.click();
  await modal.getByRole("button", { name: "تأیید انتشار آزمایشی", exact: true }).click();
  const unpublish = page.getByRole("button", { name: "بازگشت به پیش‌نویس", exact: true });
  await expect(unpublish).toBeVisible();
  await unpublish.click();
  await modal.getByRole("button", { name: "انصراف", exact: true }).click();
  await expect(modal).toBeHidden();
  await expect(unpublish).toBeFocused();
  await unpublish.click();
  await modal.getByRole("button", { name: "تأیید لغو انتشار آزمایشی", exact: true }).click();
  await expect(publish).toBeVisible();
});

test("an Author publishes, unpublishes and republishes only through the fixture reading views", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  const edit = "/dashboard/posts/00000000-0000-4000-8000-000000000001/edit";
  const reading = "/preview/posts/test-post-1";
  await page.goto("/dashboard/posts");
  await page.getByRole("listitem").filter({ hasText: "راهنمای Next.js" }).getByRole("link", { name: "ویرایش مقاله" }).click();
  const lifecycle = page.getByRole("region", { name: "وضعیت انتشار آزمایشی" });
  await expect(lifecycle).toContainText("پیش‌نویس");
  await page.getByRole("button", { name: "انتشار مقاله", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "تأیید تغییر وضعیت" })).toBeVisible();
  await page.getByRole("button", { name: "انصراف", exact: true }).click();
  await expect(lifecycle).toContainText("پیش‌نویس");
  expect((await request.get(reading)).status()).toBe(404);
  await page.getByRole("button", { name: "انتشار مقاله", exact: true }).click();
  await page.getByRole("button", { name: "تأیید انتشار آزمایشی", exact: true }).click();
  await expect(lifecycle).toContainText("در داده‌های آزمایشی منتشر شد");
  await page.reload();
  await expect(lifecycle).toContainText("منتشرشده");
  await page.getByRole("link", { name: "بازگشت به مقاله‌های من" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "راهنمای Next.js" })).toContainText("منتشرشده");
  await page.goto(reading);
  await expect(page.getByRole("article")).toContainText("راهنمای Next.js");
  await page.goto(edit);
  await page.getByRole("button", { name: "بازگشت به پیش‌نویس", exact: true }).click();
  await page.getByRole("button", { name: "تأیید لغو انتشار آزمایشی", exact: true }).click();
  await expect(lifecycle).toContainText("به پیش‌نویس برگشت");
  expect((await request.get(reading)).status()).toBe(404);
  await page.getByRole("button", { name: "انتشار مقاله", exact: true }).click();
  await page.getByRole("button", { name: "تأیید انتشار آزمایشی", exact: true }).click();
  await expect(lifecycle).toContainText("در داده‌های آزمایشی منتشر شد");
  expect((await request.get(reading)).status()).toBe(200);
});

test("publication feedback requires a saved Category, keeps Tags optional and recovers failed or uncertain fixture writes", async ({ page, request }, testInfo) => {
  const control = "http://127.0.0.1:4101/__test/dashboard?role=AUTHOR";
  await request.post(control);
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/dashboard/posts/new");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("مقاله با قالب حفظ‌شده");
  const editor = page.getByRole("textbox", { name: "متن مقاله", exact: true, includeHidden: true });
  await editor.fill("متن فارسی 123");
  await editor.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "پررنگ", exact: true }).click();
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  const lifecycle = page.getByRole("region", { name: "وضعیت انتشار آزمایشی" });
  const publish = page.getByRole("button", { name: "انتشار مقاله", exact: true });
  await expect(publish).toBeDisabled();
  await expect(lifecycle).toContainText("دست‌کم یک دسته‌بندی");
  await page.getByRole("checkbox", { name: "توسعهٔ وب" }).check();
  await expect(publish).toBeDisabled();
  await expect(lifecycle).toContainText("تغییرات مقاله را ذخیره کنید");
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(publish).toBeEnabled();
  await expect(page.getByRole("checkbox", { name: "برنامه‌نویسی" })).not.toBeChecked();
  await request.post(`${control}&saveMode=error`);
  await publish.click();
  await page.keyboard.press("Escape");
  await expect(publish).toBeFocused();
  await publish.click();
  const confirm = page.getByRole("button", { name: "تأیید انتشار آزمایشی", exact: true });
  await expect(confirm).toBeFocused();
  await confirm.click();
  const modal = page.getByRole("dialog", { name: "تأیید تغییر وضعیت" });
  await expect(modal.getByRole("alert")).toContainText("تغییر وضعیت انجام نشد");
  await expect(editor.locator("strong")).toHaveText("متن فارسی 123");
  await request.post(`${control}&saveMode=slow`);
  const count = async () => (await (await request.get("http://127.0.0.1:4101/__test/dashboard-writes")).json()).writes;
  const before = await count();
  await confirm.dblclick();
  await expect(modal.getByRole("status")).toHaveText("در حال تغییر وضعیت…");
  await page.keyboard.press("Escape");
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("button", { name: "انصراف", exact: true })).toBeDisabled();
  await expect(modal.getByRole("button", { name: "بستن", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true, includeHidden: true })).toBeDisabled();
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toBeDisabled();
  await expect(lifecycle.getByRole("status")).toContainText("در داده‌های آزمایشی منتشر شد");
  expect(await count()).toBe(before + 1);
  await page.reload();
  await expect(lifecycle).toContainText("منتشرشده");
  await expect(editor.locator("strong")).toHaveText("متن فارسی 123");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("publication-mobile.png"), fullPage: true });
  await request.post(`${control}&saveMode=uncertain`);
  await page.getByRole("button", { name: "بازگشت به پیش‌نویس", exact: true }).click();
  await page.getByRole("button", { name: "تأیید لغو انتشار آزمایشی", exact: true }).click();
  await expect(lifecycle.getByRole("alert")).toContainText("نتیجهٔ تغییر وضعیت مشخص نیست");
  await expect(page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true })).toBeDisabled();
  await page.reload();
  await expect(lifecycle).toContainText("پیش‌نویس");
  await expect(editor.locator("strong")).toHaveText("متن فارسی 123");
});

test("status-only fixture contracts preserve article data, model publication times and keep public fixture state independent", async ({ request }) => {
  const base = "http://127.0.0.1:4101";
  await request.post(`${base}/__test/dashboard?role=AUTHOR`);
  const document = { format: "tiptap-ui-proposal-1", document: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "محتوای حفظ‌شده", marks: [{ type: "bold" }] }] }] } };
  const saved = await (await request.post(`${base}/dashboard-posts`, { data: { title: "چرخهٔ مقاله", content: "محتوای حفظ‌شده", categoryIds: [], tagIds: [], previewDocument: document } })).json();
  const url = `${base}/dashboard-posts/${saved.id}`;
  const stableFields = (post: typeof saved) => ({ id: post.id, slug: post.slug, title: post.title, content: post.content, authorId: post.authorId, createdAt: post.createdAt, categories: post.categories, tags: post.tags, previewDocument: post.previewDocument });
  // The HTTP fixture intentionally does not enforce the UI's Category feedback.
  const publication = await request.patch(url, { data: { status: "PUBLISHED" } });
  expect(publication.status()).toBe(200);
  const first = await publication.json();
  expect(stableFields(first)).toEqual(stableFields(saved));
  expect(first.status).toBe("PUBLISHED");
  expect(Number.isFinite(Date.parse(first.publishedAt))).toBe(true);
  const same = await (await request.patch(url, { data: { status: "PUBLISHED" } })).json();
  expect(same.publishedAt).toBe(first.publishedAt);
  const draft = await (await request.patch(url, { data: { status: "DRAFT" } })).json();
  expect(draft.publishedAt).toBeNull();
  expect(stableFields(draft)).toEqual(stableFields(saved));
  expect((await request.get(`${base}/dashboard-public-posts/${saved.slug}`)).status()).toBe(404);
  const again = await (await request.patch(url, { data: { status: "PUBLISHED" } })).json();
  expect(Date.parse(again.publishedAt)).toBeGreaterThan(Date.parse(first.publishedAt));
  expect(stableFields(again)).toEqual(stableFields(saved));
  const visible = await (await request.get(`${base}/dashboard-public-posts/${saved.slug}`)).json();
  expect(visible).toMatchObject({ id: saved.id, content: "محتوای حفظ‌شده", status: "PUBLISHED" });
  expect(visible.previewDocument).toEqual(document);
  const publishedList = await (await request.get(`${base}/dashboard-public-posts`)).json();
  expect(publishedList.find((post: { id: string }) => post.id === saved.id)).not.toHaveProperty("previewDocument");
  expect((await request.get(`${base}/posts/${saved.slug}`)).status()).toBe(404);
  expect((await request.patch(url, { data: { status: "DEPRECATED" } })).status()).toBe(400);
  await request.post(`${base}/__test/dashboard?role=AUTHOR&reset=1`);
  expect((await request.get(url)).status()).toBe(404);
  expect((await request.get(`${base}/dashboard-public-posts/${saved.slug}`)).status()).toBe(404);
});

test("the Persian rich editor formats a selection and reloads its fixture-only UI document", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts/new");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("سند آزمایشی ویرایشگر");
  await page.getByRole("checkbox", { name: "توسعهٔ وب" }).check();
  const editor = page.getByRole("textbox", { name: "متن مقاله", exact: true });
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await editor.fill("فارسی 123 و ۱۲۳");
  await editor.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "پررنگ", exact: true }).click();
  await expect(editor.locator("strong")).toHaveText("فارسی 123 و ۱۲۳");
  await page.getByRole("button", { name: "تیتر ۲", exact: true }).click();
  await expect(editor.locator("h2")).toContainText("فارسی 123 و ۱۲۳");
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page.reload();
  await expect(editor.locator("h2 strong")).toHaveText("فارسی 123 و ۱۲۳");
  await page.getByRole("button", { name: "انتشار مقاله", exact: true }).click();
  await page.getByRole("button", { name: "تأیید انتشار آزمایشی", exact: true }).click();
  await expect(page.getByRole("region", { name: "وضعیت انتشار آزمایشی" })).toContainText("در داده‌های آزمایشی منتشر شد");
  await page.getByRole("link", { name: "مشاهده در خواندن آزمایشی" }).click();
  const reading = page.getByRole("document", { name: "متن مقاله", exact: true });
  await expect(reading).toHaveAttribute("contenteditable", "false");
  await expect(reading.locator("h2 strong")).toHaveText("فارسی 123 و ۱۲۳");
  await expect(page.getByRole("article").getByRole("toolbar")).toHaveCount(0);
  await expect(page.getByRole("article").locator("button, input, textarea, [contenteditable=true]")).toHaveCount(0);
  const rendered = await reading.innerHTML();
  await reading.focus();
  await reading.press("ControlOrMeta+b");
  await reading.press("ControlOrMeta+Alt+3");
  await page.keyboard.type("cannot edit");
  expect(await reading.innerHTML()).toBe(rendered);
  await page.reload();
  await expect(reading.locator("h2 strong")).toHaveText("فارسی 123 و ۱۲۳");
});

test("published preview reading preserves rich blocks, safe links and literal markup without editing controls", async ({ page, request }, testInfo) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  // Test-only UI document seeded through the existing HTTP fixture, then saved in the real form.
  const sampleDocument = { type: "doc", content: [
    { type: "heading", attrs: { level: 2, dir: "rtl" }, content: [{ type: "text", text: "تیتر دوم", marks: [{ type: "bold" }] }] },
    { type: "heading", attrs: { level: 3, dir: "rtl" }, content: [{ type: "text", text: "تیتر سوم", marks: [{ type: "italic" }] }] },
    { type: "heading", attrs: { level: 4, dir: "rtl" }, content: [{ type: "text", text: "تیتر چهارم" }] },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "نشانه" }] }] }] },
    { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "شماره" }] }] }] },
    { type: "paragraph", attrs: { dir: "ltr" }, content: [{ type: "text", text: "English 123" }] },
    { type: "paragraph", attrs: { dir: "rtl" }, content: [{ type: "text", text: "پیوند امن", marks: [{ type: "link", attrs: { href: "https://example.test/guide" } }] }] },
    { type: "paragraph", content: [{ type: "text", text: "پیوند ناامن", marks: [{ type: "link", attrs: { href: "javascript:window.previewExecuted=true" } }] }] },
    { type: "codeBlock", attrs: { dir: "ltr" }, content: [{ type: "text", text: 'const n = 123; // فارسی ۱۲۳' }] },
    { type: "paragraph", content: [{ type: "text", text: '<img src=x onerror="window.previewExecuted=true">' }] },
  ] };
  const saved = await (await request.post("http://127.0.0.1:4101/dashboard-posts", { data: {
    title: "نمایش سند قالب‌دار", content: "تیتر دوم\nتیتر سوم\nتیتر چهارم\nنشانه\nشماره\nEnglish 123\nپیوند امن\nپیوند ناامن\nconst n = 123; // فارسی ۱۲۳\n<img src=x onerror=\"window.previewExecuted=true\">",
    categoryIds: ["20000000-0000-4000-8000-000000000001"], tagIds: [], previewDocument: { format: "tiptap-ui-proposal-1", document: sampleDocument },
  } })).json();
  await page.goto(`/dashboard/posts/${saved.id}/edit`);
  await expect(page.getByRole("textbox", { name: "متن مقاله", exact: true }).locator("h2 strong")).toHaveText("تیتر دوم");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("سند ذخیره‌شده و منتشرشده");
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page.getByRole("button", { name: "انتشار مقاله", exact: true }).click();
  await page.getByRole("button", { name: "تأیید انتشار آزمایشی", exact: true }).click();
  await expect(page.getByRole("region", { name: "وضعیت انتشار آزمایشی" })).toContainText("در داده‌های آزمایشی منتشر شد");
  await page.getByRole("link", { name: "مشاهده در خواندن آزمایشی" }).click();
  const reading = page.getByRole("document", { name: "متن مقاله", exact: true });
  await expect(reading).toHaveAttribute("contenteditable", "false");
  await expect(reading.locator("h2 strong")).toHaveText("تیتر دوم");
  await expect(reading.locator("h3 em")).toHaveText("تیتر سوم");
  await expect(reading.locator("h4")).toHaveText("تیتر چهارم");
  await expect(reading.locator("ul li")).toHaveText("نشانه");
  await expect(reading.locator("ol li")).toHaveText("شماره");
  await expect(reading.getByText("English 123", { exact: true })).toHaveAttribute("dir", "ltr");
  await expect(reading.locator("h2")).toHaveAttribute("dir", "rtl");
  await expect(reading.getByRole("link", { name: "پیوند امن", exact: true })).toHaveAttribute("href", "https://example.test/guide");
  await expect(reading.locator('a[href^="javascript:"]')).toHaveCount(0);
  await expect(reading.locator("pre")).toHaveCSS("direction", "ltr");
  await expect(reading.locator("pre code")).toHaveText('const n = 123; // فارسی ۱۲۳');
  await expect(reading).toContainText('<img src=x onerror="window.previewExecuted=true">');
  await expect(reading.locator("img, script, button, input, textarea")).toHaveCount(0);
  await expect(page.getByRole("article").getByRole("toolbar")).toHaveCount(0);
  expect(await page.evaluate(() => "previewExecuted" in window)).toBe(false);
  await page.setViewportSize({ width: 360, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("readonly-reading-mobile.png"), fullPage: true });
  await page.reload();
  await expect(reading.locator("h3 em")).toHaveText("تیتر سوم");
});

test("editor toolbar keyboard access preserves selection and history across unrelated form changes", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts/new");
  const editor = page.getByRole("textbox", { name: "متن مقاله", exact: true });
  await editor.fill("انتخاب پایدار 42");
  await editor.press("ControlOrMeta+a");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("تغییر عنوان");
  await page.getByRole("checkbox", { name: "توسعهٔ وب" }).check();
  await page.getByRole("button", { name: "پررنگ", exact: true }).click();
  await expect(editor.locator("strong")).toHaveText("انتخاب پایدار 42");
  await editor.press("Alt+F10");
  await expect(page.getByRole("button", { name: "بند معمولی", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("button", { name: "تیتر ۲", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "بند معمولی", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("button", { name: "واگرد", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(editor).toBeFocused();
  await expect(editor.locator("strong")).toHaveCount(0);
  await page.getByRole("button", { name: "ازنو", exact: true }).click();
  await expect(editor.locator("strong")).toHaveText("انتخاب پایدار 42");
  await editor.press("Alt+F10");
  await page.keyboard.press("Escape");
  await expect(editor).toBeFocused();
});

test("rich editor supports reviewed headings, lists, block direction, LTR code and composition text", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts/new");
  const editor = page.getByRole("textbox", { name: "متن مقاله", exact: true });
  await expect(editor).toHaveAttribute("dir", "rtl");
  await editor.fill("متن فارسی 123 و ۱۲۳");
  await editor.press("ControlOrMeta+a");
  for (const level of [2, 3, 4]) {
    await page.getByRole("button", { name: `تیتر ${["", "", "۲", "۳", "۴"][level]}`, exact: true }).click();
    await expect(editor.locator(`h${level}`)).toHaveText("متن فارسی 123 و ۱۲۳");
  }
  await page.getByRole("button", { name: "بند معمولی", exact: true }).click();
  await page.getByRole("button", { name: "کج", exact: true }).click();
  await expect(editor.locator("em")).toHaveText("متن فارسی 123 و ۱۲۳");
  for (const [name, tag] of [["فهرست نشانه‌دار", "ul"], ["فهرست شماره‌دار", "ol"]]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(editor.locator(`${tag} li`)).toContainText("متن فارسی 123 و ۱۲۳");
    await page.getByRole("button", { name, exact: true }).click();
  }
  await page.getByRole("button", { name: "جهت بند چپ‌به‌راست", exact: true }).click();
  await expect(editor.locator("p")).toHaveAttribute("dir", "ltr");
  await page.getByRole("button", { name: "جهت بند راست‌به‌چپ", exact: true }).click();
  await expect(editor.locator("p")).toHaveAttribute("dir", "rtl");
  await editor.press("ControlOrMeta+End");
  await editor.press("Enter");
  await page.getByRole("button", { name: "بلوک کد", exact: true }).click();
  await page.keyboard.insertText('const count = 123; // فارسی ۱۲۳');
  await expect(editor.locator("pre")).toHaveCSS("direction", "ltr");
  await expect(editor.locator("pre code")).toHaveText('const count = 123; // فارسی ۱۲۳');
  await editor.dispatchEvent("compositionstart", { data: "" });
  await page.keyboard.insertText(" می‌نویسم");
  await editor.dispatchEvent("compositionend", { data: " می‌نویسم" });
  await expect(editor).toContainText("می‌نویسم");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("فارسی و کد");
  await page.getByRole("button", { name: "ذخیرهٔ آزمایشی", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page.reload();
  await expect(editor.locator("pre")).toHaveCSS("direction", "ltr");
  await expect(editor).toContainText('const count = 123; // فارسی ۱۲۳ می‌نویسم');
});

test("link editing gives safe Persian feedback and restores the selected text", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__test/dashboard?role=AUTHOR");
  await page.goto("/dashboard/posts/new");
  const editor = page.getByRole("textbox", { name: "متن مقاله", exact: true });
  await editor.fill("پیوند انتخاب‌شده");
  await editor.press("ControlOrMeta+End");
  await page.getByRole("button", { name: "ویرایش پیوند", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("ابتدا بخشی از متن را انتخاب کنید");
  await editor.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "ویرایش پیوند", exact: true }).click();
  const url = page.getByLabel("نشانی پیوند", { exact: true });
  await expect(url).toBeFocused();
  await url.fill("javascript:alert(1)");
  await page.getByRole("button", { name: "اعمال پیوند", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("یک نشانی کامل");
  await expect(editor.locator("a")).toHaveCount(0);
  await url.fill("https://example.test/guide");
  await url.press("Enter");
  await expect(editor.locator("a")).toHaveAttribute("href", "https://example.test/guide");
  await expect(editor.locator("a")).toHaveText("پیوند انتخاب‌شده");
  await page.getByRole("button", { name: "ویرایش پیوند", exact: true }).click();
  await page.getByRole("button", { name: "حذف پیوند", exact: true }).click();
  await expect(editor.locator("a")).toHaveCount(0);
  await expect(editor).toHaveText("پیوند انتخاب‌شده");
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
  await expect(page.getByLabel("متن مقاله", { exact: true })).toHaveText("متن ساده <strong>بدون تبدیل</strong>\nخط دوم", { useInnerText: true });
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
  await expect(page.getByLabel("متن مقاله", { exact: true })).toHaveText("متن حفظ می‌شود.");
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
  const previewDocument = { format: "tiptap-ui-proposal-1", document: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "متن ساده" }] }, { type: "paragraph", content: [{ type: "text", text: "بدون JSON" }] }] } };
  const input = { title: "قرارداد آزمایشی", content: "متن ساده\nبدون JSON", categoryIds: ["20000000-0000-4000-8000-000000000001"], tagIds: ["40000000-0000-4000-8000-000000000001"], previewDocument };
  const response = await request.post(`${base}/dashboard-posts`, { data: input });
  expect(response.status()).toBe(201);
  const payload = await response.json();
  expect(payload.content).toBe("متن ساده\nبدون JSON");
  expect(payload.previewDocument).toEqual(previewDocument);
  const saved = parseArticleWrite(payload);
  expect(saved).toMatchObject({ title: input.title, content: input.content, status: "DRAFT", publishedAt: null });
  expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(saved.slug).toMatch(/^fixture-draft-/);
  expect(payload).not.toHaveProperty("author");
  expect(payload.categories[0]).toHaveProperty("createdAt");
  expect(() => parseArticleDetail(payload)).toThrow();
  const detail = await (await request.get(`${base}/dashboard-posts/${saved.id}`)).json();
  expect(detail.previewDocument).toEqual(previewDocument);
  expect(parseArticleDetail(detail)).toEqual(saved);
  expect(detail.categories[0]).not.toHaveProperty("createdAt");
  expect(() => parseArticleWrite(detail)).toThrow();
  for (const invalid of [{ ...detail, content: {} }, { ...detail, author: { ...detail.author, id: "other" } }, { ...detail, categories: null }]) expect(() => parseArticleDetail(invalid)).toThrow();
  const list = await (await request.get(`${base}/dashboard-posts?page=1&limit=10`)).json();
  expect(list.data[0]).toMatchObject({ id: saved.id, slug: saved.slug, title: input.title });
  expect(list.data[0]).not.toHaveProperty("categories");
  expect(list.data[0]).not.toHaveProperty("previewDocument");
  expect((await request.patch(`${base}/dashboard-posts/${saved.id}`, { data: { ...input, previewDocument: { ...previewDocument, format: "unknown" } } })).status()).toBe(400);
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
      await expect(page.getByRole("button", { name: "بند معمولی", exact: true })).toBeFocused();
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
    const filters = page.getByRole("navigation", { name: "وضعیت مقاله‌ها" });
    for (const link of await filters.getByRole("link").all()) {
      const bounds = await link.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
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
