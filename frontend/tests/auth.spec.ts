import { expect, test } from "@playwright/test";

test("production login uses real email fields with no fixture role choice", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "ورود / ثبت‌نام", exact: true }).click();
  for (const [route, title] of [["login", "ورود"], ["register", "ثبت‌نام"]]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByLabel("ایمیل", { exact: true })).toBeVisible();
    await expect(page.getByLabel("گذرواژه", { exact: true })).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByText("هنوز فعال نیست.", { exact: false })).toHaveCount(0);
    for (const [provider, href] of [["گوگل", "/auth/google"], ["گیت‌هاب", "/auth/github"]]) {
      await expect(page.getByRole("link", { name: `${title} با ${provider}`, exact: true })).toHaveAttribute("href", href);
    }
  }
  expect((await request.post("/__test/auth", { data: { operation: "login", role: "AUTHOR", provider: "email" } })).status()).toBe(404);
});

test("login shows safe invalid-credential and rate-limit errors", async ({ page }) => {
  for (const [email, message] of [
    ["bad@example.test", "ایمیل یا گذرواژه نادرست است."],
    ["limited@example.test", "تلاش‌های بیش از حد. کمی بعد دوباره امتحان کنید."],
  ]) {
    await page.goto("/login");
    await page.getByLabel("ایمیل", { exact: true }).fill(email);
    await page.getByLabel("گذرواژه", { exact: true }).fill("Secret1!");
    await page.getByRole("button", { name: "ورود با ایمیل" }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveText(message);
  }
});

test("registration creates no session, then redirects to the separate login step", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("ایمیل", { exact: true }).fill("new-user@example.test");
  await page.getByLabel("گذرواژه", { exact: true }).fill("Secret1!");
  await page.getByLabel("تکرار گذرواژه", { exact: true }).fill("Secret1!");
  await page.getByRole("button", { name: "ثبت‌نام با ایمیل" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1$/);
  await expect(page.getByText("ثبت‌نام انجام شد.", { exact: false })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name.includes("kia_session"))).toBe(false);
});

test("registration reports duplicate and rate-limit failures in Persian", async ({ page }) => {
  for (const [email, message] of [
    ["taken@example.test", "حسابی با این ایمیل از قبل وجود دارد. وارد شوید."],
    ["limited@example.test", "تلاش‌های بیش از حد. کمی بعد دوباره امتحان کنید."],
  ]) {
    await page.goto("/register");
    await page.getByLabel("ایمیل", { exact: true }).fill(email);
    await page.getByLabel("گذرواژه", { exact: true }).fill("Secret1!");
    await page.getByLabel("تکرار گذرواژه", { exact: true }).fill("Secret1!");
    await page.getByRole("button", { name: "ثبت‌نام با ایمیل" }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveText(message);
  }
});
