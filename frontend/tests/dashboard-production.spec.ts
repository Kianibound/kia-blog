import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const fixture = "http://127.0.0.1:4101";

async function resetFixture(request: APIRequestContext) {
  await request.post(`${fixture}/__test/auth-mode?mode=normal`);
  await request.post(`${fixture}/__test/session?mode=clear`);
  await request.post(`${fixture}/__test/inventory?mode=success`);
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
  await expect(page.getByRole("link", { name: "مقاله جدید" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "ویرایش" })).toHaveCount(0);

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
  await expect(page.getByRole("link", { name: "مقاله جدید" })).toHaveCount(0);
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
