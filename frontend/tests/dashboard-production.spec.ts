import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const fixture = "http://127.0.0.1:4101";

async function resetFixture(request: APIRequestContext) {
  await request.post(`${fixture}/__test/auth-mode?mode=normal`);
  await request.post(`${fixture}/__test/session?mode=clear`);
  await request.post(`${fixture}/__test/inventory?mode=success`);
  await request.post(`${fixture}/__test/articles?mode=reset`);
  await request.post(`${fixture}/__test/media?mode=success`);
}

async function login(page: Page, email: string, next = "/dashboard") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("ایمیل", { exact: true }).fill(email);
  await page.getByLabel("گذرواژه", { exact: true }).fill("Secret1!");
  await page.getByRole("button", { name: "ورود با ایمیل" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}

async function dashboardNavigation(page: Page) {
  return page.getByRole("navigation", { name: "راهبری پیشخوان" }).getByRole("link").allTextContents();
}

async function expectNotFound(page: Page) {
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "راهبری پیشخوان" })).toHaveCount(0);
}

test.afterEach(async ({ request, context }) => {
  await resetFixture(request);
  await context.clearCookies();
});

test("signed-out dashboard and deep links redirect safely through login", async ({ page }) => {
  for (const [path, encoded] of [
    ["/dashboard", "%2Fdashboard"],
    ["/dashboard/comments", "%2Fdashboard%2Fcomments"],
    ["/dashboard/posts", "%2Fdashboard%2Fposts"],
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encoded}$`));
    await expect(page.getByRole("heading", { level: 1, name: "ورود", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "راهبری پیشخوان" })).toHaveCount(0);
  }
});

test("USER gets USER navigation and cannot open AUTHOR or ADMIN deep links", async ({ page }) => {
  await login(page, "user@example.test");
  expect(await dashboardNavigation(page)).toEqual(["پیشخوان", "مقالات ذخیره‌شده", "کامنت‌های من"]);
  for (const path of ["/dashboard/posts", "/dashboard/workspace", "/dashboard/comments", "/dashboard/categories", "/dashboard/authors"]) {
    await page.goto(path);
    await expectNotFound(page);
  }
  await page.goto("/dashboard/nope");
  await expectNotFound(page);
});

test("AUTHOR gets AUTHOR navigation and cannot open USER or ADMIN deep links", async ({ page }) => {
  await login(page, "author@example.test");
  expect(await dashboardNavigation(page)).toEqual(["پیشخوان", "فضای نویسندگی", "مقاله‌های من", "عکس پروفایل"]);
  for (const path of ["/dashboard/posts", "/dashboard/workspace", "/dashboard/avatar"]) {
    expect((await page.goto(path))?.status()).toBe(200);
  }
  for (const path of ["/dashboard/bookmarks", "/dashboard/my-comments", "/dashboard/comments", "/dashboard/categories", "/dashboard/authors"]) {
    await page.goto(path);
    await expectNotFound(page);
  }
});

test("ADMIN follows the approved ADMIN route matrix and is denied USER links", async ({ page }) => {
  await login(page, "admin@example.test");
  expect(await dashboardNavigation(page)).toEqual(["پیشخوان", "فضای مدیریت", "دسته‌بندی‌ها و تگ‌ها", "کامنت‌ها", "مقاله‌ها", "نویسندگان"]);
  for (const path of ["/dashboard/workspace", "/dashboard/posts", "/dashboard/comments", "/dashboard/categories", "/dashboard/authors"]) {
    expect((await page.goto(path))?.status()).toBe(200);
  }
  for (const path of ["/dashboard/bookmarks", "/dashboard/my-comments"]) {
    await page.goto(path);
    await expectNotFound(page);
  }
});

test("temporary Nest failure keeps the user signed in and renders an unavailable state", async ({ page, request }) => {
  await login(page, "user@example.test");
  await request.post(`${fixture}/__test/auth-mode?mode=unavailable`);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("alert").getByText("دریافت اطلاعات پیشخوان ممکن نشد.", { exact: false })).toBeVisible();
  expect((await page.context().cookies()).some((cookie) => cookie.name.includes("kia_session"))).toBe(true);

  await request.post(`${fixture}/__test/auth-mode?mode=normal`);
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "راهبری پیشخوان" })).toBeVisible();
});

test("revoked and cleared sessions redirect to login and clear the cookie", async ({ page, request }) => {
  for (const mode of ["revoke", "clear"]) {
    await resetFixture(request);
    await login(page, "user@example.test");
    if (mode === "revoke") {
      await request.post(`${fixture}/__test/auth-mode?mode=revoke`);
    } else {
      await request.post(`${fixture}/__test/session?mode=clear`);
    }
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
    expect((await page.context().cookies()).some((cookie) => cookie.name.includes("kia_session"))).toBe(false);
  }
});

test("an invalid session cookie is cleared and never renders protected content", async ({ page, context }) => {
  await context.addCookies([
    {
      name: "__Host-kia_session",
      value: "invalid-session-id",
      domain: "127.0.0.1",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  expect((await context.cookies()).some((cookie) => cookie.name.includes("kia_session"))).toBe(false);
  await expect(page.getByRole("navigation", { name: "راهبری پیشخوان" })).toHaveCount(0);
});

test("AUTHOR inventory uses the real mine endpoint, filters and pagination", async ({ page }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts");
  await expect(page.getByRole("heading", { name: /مقالهٔ آزمایشی/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "مقالهٔ جدید" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ویرایش مقاله" })).toHaveCount(10);

  await page.locator('a[href="/dashboard/posts?status=DRAFT"]').click();
  await expect(page).toHaveURL(/status=DRAFT$/);
  await expect(page.getByRole("heading", { name: /مقالهٔ آزمایشی/ })).toHaveCount(4);

  await page.goto("/dashboard/posts");
  await page.locator('a[href="/dashboard/posts?page=2"]').click();
  await expect(page).toHaveURL(/page=2$/);
  await expect(page.getByRole("heading", { name: /مقالهٔ آزمایشی/ })).toHaveCount(2);
});

test("ADMIN inventory shows all statuses and real author summaries without mutations", async ({ page }) => {
  await login(page, "admin@example.test");
  await page.goto("/dashboard/posts");
  await expect(page.getByRole("heading", { name: /مقالهٔ آزمایشی/ })).toHaveCount(5);
  await expect(page.getByText("سارا", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "مقالهٔ جدید" })).toBeVisible();
  await expect(page.getByRole("button", { name: "حذف" })).toHaveCount(0);
});

test("invalid status queries are rejected instead of silently showing all posts", async ({ page }) => {
  await login(page, "author@example.test");
  for (const status of ["DEPRECATED", "deprecated", "UNKNOWN"]) {
    await page.goto(`/dashboard/posts?status=${status}`);
    await expect(page.getByText("فیلتر وضعیت انتخابی معتبر نیست.", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: /مقالهٔ آزمایشی/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "نمایش همهٔ مقاله‌ها" })).toBeVisible();
  }
  await page.goto("/dashboard/posts?status=DRAFT");
  await expect(page.getByRole("heading", { name: /مقالهٔ آزمایشی/ })).toHaveCount(4);

  await page.context().clearCookies();
  await login(page, "admin@example.test");
  await page.goto("/dashboard/posts?status=DRAFT");
  await expect(page.getByText("فیلتر وضعیت انتخابی معتبر نیست.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: /مقالهٔ آزمایشی/ })).toHaveCount(0);
});

test("AUTHOR and ADMIN denial is distinct from recoverable backend failure", async ({ page, request }) => {
  for (const [email, unavailable] of [
    ["author@example.test", "دریافت مقاله‌های شما ممکن نشد."],
    ["admin@example.test", "دریافت مقاله‌ها ممکن نشد."],
  ]) {
    await page.context().clearCookies();
    await login(page, email);
    await request.post(`${fixture}/__test/inventory?mode=forbidden`);
    await page.goto("/dashboard/posts");
    await expect(page.getByText("دسترسی به این فهرست برای نقش شما مجاز نیست.", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "تلاش دوباره" })).toHaveCount(0);

    await request.post(`${fixture}/__test/inventory?mode=error`);
    await page.goto("/dashboard/posts");
    await expect(page.getByText(unavailable, { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "تلاش دوباره" })).toBeVisible();
  }
});

test("ADMIN empty, error and out-of-range pages stay recoverable", async ({ page, request }) => {
  await login(page, "admin@example.test");

  await request.post(`${fixture}/__test/inventory?mode=empty`);
  await page.goto("/dashboard/posts");
  await expect(page.locator("main").getByRole("status")).toBeVisible();

  await request.post(`${fixture}/__test/inventory?mode=error`);
  await page.goto("/dashboard/posts");
  await expect(page.locator("main").getByRole("alert")).toBeVisible();

  await request.post(`${fixture}/__test/inventory?mode=success`);
  await page.goto("/dashboard/posts?page=2");
  await expect(page.getByText("در این صفحه مقاله‌ای وجود ندارد.", { exact: false })).toBeVisible();
  await expect(page.locator('main a[href="/dashboard/posts"]')).toBeVisible();
});

test("AUTHOR creates and reloads a canonical rich article from the production editor", async ({ page }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/new");
  await expect(page.getByRole("heading", { name: "مقالهٔ جدید", exact: true })).toBeVisible();
  await expect(page.getByText("داده‌های آزمایشی", { exact: false })).toHaveCount(0);
  await expect(page.getByText("خواندن آزمایشی", { exact: false })).toHaveCount(0);

  const editor = page.getByRole("textbox", { name: "متن مقاله", exact: true });
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("مقالهٔ تازه");
  await editor.fill("متن تازه");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.getByText("مقاله ذخیره شد.", { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/posts\/created-1\/edit$/);

  await page.reload();
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveValue("مقالهٔ تازه");
  await expect(page.getByRole("textbox", { name: "متن مقاله", exact: true })).toContainText("متن تازه");

  await page.getByRole("button", { name: "انتشار مقاله", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "تأیید انتشار مقاله", exact: true }).click();
  await expect(page.getByText("مقاله منتشر شد.", { exact: false })).toBeVisible();
});

test("AUTHOR edits an owned article and ADMIN can open the same editor", async ({ page }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-1/edit");
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveValue("مقالهٔ قابل ویرایش");
  await expect(page.getByRole("textbox", { name: "متن مقاله", exact: true })).toContainText("متن اولیه");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("عنوان ویرایش‌شده");
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.getByText("مقاله ذخیره شد.", { exact: false })).toBeVisible();

  await page.goto("/dashboard/posts/post-2/edit");
  await expect(page.getByLabel("عنوان مقاله")).toHaveCount(0);

  await page.context().clearCookies();
  await login(page, "admin@example.test");
  await page.goto("/dashboard/posts/post-1/edit");
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "متن مقاله", exact: true })).toBeVisible();
  await page.goto("/dashboard/posts/post-2/edit");
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveValue("مقالهٔ نویسندهٔ دیگر");
});

test("USER cannot open production article editor routes", async ({ page }) => {
  await login(page, "user@example.test");
  for (const path of ["/dashboard/posts/new", "/dashboard/posts/post-1/edit"]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByLabel("عنوان مقاله")).toHaveCount(0);
  }
});

test("canonical image media IDs survive edit and save without becoming src URLs", async ({ page, request }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-5/edit");
  await expect(page.getByRole("textbox", { name: "متن مقاله", exact: true })).toContainText("متن تصویر");
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.getByText("مقاله ذخیره شد.", { exact: false })).toBeVisible();

  const write = await request.get(`${fixture}/__test/articles`).then((response) => response.json());
  const image = write.body.contentDocument.content.find((node: { type?: string }) => node.type === "image");
  expect(image.attrs.mediaId).toBe("40000000-0000-4000-8000-000000000001");
  expect(image.attrs.alt).toBe("تصویر متن");
  expect(image.attrs.src).toBeUndefined();
});

test("unchanged legacy saves keep content and intentional edits convert to contentDocument", async ({ page, request }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-4/edit");
  await page.getByLabel("عنوان مقاله", { exact: true }).fill("عنوان متنی");
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.getByText("مقاله ذخیره شد.", { exact: false })).toBeVisible();

  let write = await request.get(`${fixture}/__test/articles`).then((response) => response.json());
  expect(write.body.content).toBe("متن قدیمی\nخط دوم");
  expect(write.body.contentDocument).toBeUndefined();

  const editor = page.getByRole("textbox", { name: "متن مقاله", exact: true });
  await editor.fill("متن تازه");
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.getByText("مقاله ذخیره شد.", { exact: false })).toBeVisible();
  write = await request.get(`${fixture}/__test/articles`).then((response) => response.json());
  expect(write.body.content).toBeUndefined();
  expect(write.body.contentDocument.type).toBe("doc");
});

test("published articles cannot lose their last category", async ({ page }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-7/edit");
  await page.getByRole("checkbox").first().uncheck();
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("عنوان مقاله", { exact: true })).toHaveValue("مقالهٔ منتشرشده");
});

test("unsupported image nodes block editing and preserve the source", async ({ page, request }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-6/edit");
  await expect(page.getByText("این مقاله تصویر ناسازگار دارد", { exact: false })).toBeVisible();
  await expect(page.getByLabel("عنوان مقاله")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /ذخیره/ })).toHaveCount(0);
  const write = await request.get(`${fixture}/__test/articles`).then((response) => response.json());
  expect(write).toBeNull();
});

test("DEPRECATED articles can be republished when a category exists", async ({ page, request }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-3/edit");
  await expect(page.getByRole("button", { name: "انتشار مقاله", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "انتشار مقاله", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "تأیید انتشار مقاله", exact: true }).click();
  await expect(page.getByText("مقاله منتشر شد.", { exact: false })).toBeVisible();
  const write = await request.get(`${fixture}/__test/articles`).then((response) => response.json());
  expect(write.body).toEqual({ status: "PUBLISHED" });
});

test("production upload inserts canonical mediaIds for body image and cover, and cover removal clears it", async ({ page, request }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-5/edit");
  await page.getByRole("button", { name: "افزودن تصویر", exact: true }).click();
  await page.getByLabel("فایل تصویر", { exact: true }).setInputFiles("public/social/linkedin.png");
  await page.getByLabel("متن جایگزین تصویر", { exact: true }).fill("تصویر تازه");
  await page.getByRole("button", { name: "درج تصویر", exact: true }).click();
  await expect(page.locator(".rich-editor img")).toHaveCount(2);
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.getByText("مقاله ذخیره شد.", { exact: false })).toBeVisible();

  let write = await request.get(`${fixture}/__test/articles`).then((response) => response.json());
  const images = write.body.contentDocument.content.filter((node: { type?: string }) => node.type === "image");
  expect(images.map((node: { attrs: { mediaId: string } }) => node.attrs.mediaId)).toContain("40000000-0000-4000-8000-000000000099");
  await page.reload();
  await expect(page.locator(".rich-editor img")).toHaveCount(2);

  await page.goto("/dashboard/posts/post-1/edit");
  await page.getByLabel("فایل تصویر جلد", { exact: true }).setInputFiles("public/social/linkedin.png");
  await page.getByLabel("متن جایگزین جلد", { exact: true }).fill("جلد تازه");
  await page.getByRole("button", { name: "انتخاب تصویر جلد", exact: true }).click();
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.getByText("مقاله ذخیره شد.", { exact: false })).toBeVisible();
  write = await request.get(`${fixture}/__test/articles`).then((response) => response.json());
  expect(write.body.coverMediaId).toBe("40000000-0000-4000-8000-000000000099");
  expect(write.body.coverAlt).toBe("جلد تازه");

  await page.getByRole("button", { name: "حذف تصویر جلد", exact: true }).click();
  await page.getByRole("button", { name: /ذخیره/ }).click();
  await expect(page.getByText("مقاله ذخیره شد.", { exact: false })).toBeVisible();
  write = await request.get(`${fixture}/__test/articles`).then((response) => response.json());
  expect(write.body.coverMediaId).toBeNull();
  expect(write.body.coverAlt).toBeUndefined();
});

test("missing server-resolved media blocks editing with a clear Persian error", async ({ page }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-8/edit");
  await expect(page.getByText("این مقاله تصویر ناسازگار دارد", { exact: false })).toBeVisible();
  await expect(page.getByLabel("عنوان مقاله")).toHaveCount(0);
  await expect(page.getByRole("img")).toHaveCount(0);
});

test("cover upload error states are specific and leak no backend details", async ({ page, request }) => {
  await login(page, "author@example.test");
  await page.goto("/dashboard/posts/post-1/edit");
  await expect(page.getByRole("textbox", { name: "متن مقاله", exact: true })).toHaveAttribute("contenteditable", "true");

  for (const [mode, message] of [
    ["too-large", "حجم تصویر باید کمتر از ۵ مگابایت باشد."],
    ["invalid", "فقط تصویر JPEG، PNG یا WebP مجاز است."],
  ]) {
    await request.post(`${fixture}/__test/media?mode=${mode}`);
    const fileInput = page.getByLabel("فایل تصویر جلد", { exact: true });
    const altInput = page.getByLabel("متن جایگزین جلد", { exact: true });
    await fileInput.setInputFiles("public/social/linkedin.png");
    await expect.poll(async () => fileInput.evaluate((input: HTMLInputElement) => input.files?.length)).toBe(1);
    await altInput.fill("جلد آزمایش");
    await expect(altInput).toHaveValue("جلد آزمایش");
    await page.getByRole("button", { name: "انتخاب تصویر جلد", exact: true }).click();
    await expect(page.locator("#cover-error")).toHaveText(message);
    await request.post(`${fixture}/__test/media?mode=success`);
  }

  await request.post(`${fixture}/__test/media?mode=slow`);
  const slowFile = page.getByLabel("فایل تصویر جلد", { exact: true });
  const slowAlt = page.getByLabel("متن جایگزین جلد", { exact: true });
  await slowFile.setInputFiles("public/social/linkedin.png");
  await expect.poll(async () => slowFile.evaluate((input: HTMLInputElement) => input.files?.length)).toBe(1);
  await slowAlt.fill("جلد لغوشده");
  await expect(slowAlt).toHaveValue("جلد لغوشده");
  await page.getByRole("button", { name: "انتخاب تصویر جلد", exact: true }).click();
  await expect(page.getByText("در حال بارگذاری تصویر…", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "انصراف از انتخاب جلد", exact: true }).click();
  await expect(page.locator("#cover-error")).toHaveText("");
  await request.post(`${fixture}/__test/media?mode=success`);

  await request.post(`${fixture}/__test/auth-mode?mode=revoke`);
  const authFile = page.getByLabel("فایل تصویر جلد", { exact: true });
  const authAlt = page.getByLabel("متن جایگزین جلد", { exact: true });
  await authFile.setInputFiles("public/social/linkedin.png");
  await expect.poll(async () => authFile.evaluate((input: HTMLInputElement) => input.files?.length)).toBe(1);
  await authAlt.fill("جلد نشست");
  await expect(authAlt).toHaveValue("جلد نشست");
  await page.getByRole("button", { name: "انتخاب تصویر جلد", exact: true }).click();
  await expect(page.locator("#cover-error")).toHaveText("نشست شما معتبر نیست. صفحه را دوباره بارگذاری کنید.");
  await expect(page.getByText("Unauthorized", { exact: false })).toHaveCount(0);
});

test("production upload errors stay in the editor and expose no backend details", async ({ page, request }) => {
  await login(page, "author@example.test");
  await request.post(`${fixture}/__test/media?mode=too-large`);
  await page.goto("/dashboard/posts/post-5/edit");
  await page.getByRole("button", { name: "افزودن تصویر", exact: true }).click();
  await page.getByLabel("فایل تصویر", { exact: true }).setInputFiles("public/social/linkedin.png");
  await page.getByLabel("متن جایگزین تصویر", { exact: true }).fill("تصویر بزرگ");
  await page.getByRole("button", { name: "درج تصویر", exact: true }).click();
  await expect(page.getByText("حجم تصویر باید کمتر از ۵ مگابایت باشد.", { exact: false })).toBeVisible();
  await expect(page.getByText("Too large", { exact: false })).toHaveCount(0);
});
