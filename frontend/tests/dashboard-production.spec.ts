import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const fixture = "http://127.0.0.1:4101";

async function resetFixture(request: APIRequestContext) {
  await request.post(`${fixture}/__test/auth-mode?mode=normal`);
  await request.post(`${fixture}/__test/session?mode=clear`);
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
