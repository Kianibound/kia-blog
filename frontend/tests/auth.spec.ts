import { expect, test } from "@playwright/test";

test("production auth screens offer no fixture login or account writes", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "ورود / ثبت‌نام", exact: true }).click();
  for (const [route, title] of [["login", "ورود"], ["register", "ثبت‌نام"]]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByText("ورود و ثبت‌نام هنوز فعال نیست.", { exact: false })).toBeVisible();
    for (const provider of ["ایمیل", "گوگل", "گیت‌هاب"]) {
      await expect(page.getByRole("button", { name: `${title} با ${provider}`, exact: true })).toBeDisabled();
    }
  }
  expect((await request.post("/__test/auth", { data: { operation: "login", role: "AUTHOR", provider: "email" } })).status()).toBe(404);
  expect((await request.get("/dashboard")).status()).toBe(404);
});
