import { expect, test } from "@playwright/test";

// Nobody is signed in here: these are the pages a visitor sees, and the doors that stay shut.

test("the landing page leads to sign-up", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Започни безплатно" }).first()).toBeVisible();
});

test("sign-in offers a forgotten password, carrying the e-mail already typed", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  await page.getByLabel("Имейл").fill("driver@example.com");
  await page.getByRole("link", { name: "Забравена парола?" }).click();
  await expect(page).toHaveURL(/\/login\/forgot\?email=driver%40example\.com/);
  await expect(page.getByLabel("Имейл")).toHaveValue("driver@example.com");
  await expect(page.getByRole("button", { name: "Изпрати линк" })).toBeVisible();
});

test("the logo on the sign-in page goes back to the start", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Glovebox, начало" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the legal pages and the inspection calculator open", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Политика за поверителност" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Общи условия" })).toBeVisible();
  const calculator = await page.goto("/tehnicheski-pregled");
  expect(calculator?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

for (const path of ["/documents", "/vehicles", "/account", "/analysis", "/add-service", "/services/1"]) {
  test(`${path} asks to sign in first`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}

test("the reminder job refuses a caller without the secret in the header", async ({ request }) => {
  expect((await request.get("/api/cron/send-reminders?dry=1")).status()).toBe(401);
  // Not even the right secret in the address counts: only the Authorization header does.
  expect((await request.get("/api/cron/send-reminders?dry=1&secret=guess")).status()).toBe(401);
});
