// What a person does in the pinger: see the devices, pick some, ping them
// and watch each one answer.
import { test, expect } from "@playwright/test";

test("opens with its twenty devices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Network Pinger Demo" })).toBeVisible();
  await expect(page.getByText(/^Device-Node-\d+/)).toHaveCount(20);
});

test("picking devices enables the ping button", async ({ page }) => {
  await page.goto("/");
  const ping = page.getByRole("button", { name: /PING SELECTED/ });
  await expect(ping).toBeDisabled();
  await page.getByText("Device-Node-1", { exact: false }).first().click();
  await page.getByText("Device-Node-2", { exact: false }).first().click();
  await expect(ping).toHaveText("PING SELECTED (2)");
  await expect(ping).toBeEnabled();
});

// The round trip through the backend, Redis and the worker. The frontend
// calls http://localhost:4000, which in a visitor's browser is their own
// computer: until it calls its backend's address, this test fails, and it
// only reports.
test("pinging shows each device's result", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Device-Node-3", { exact: false }).first().click();
  await page.getByRole("button", { name: /PING SELECTED/ }).click();
  await expect(page.getByRole("heading", { name: "Ping Status" })).toBeVisible();
  await expect(page.getByText("Progress: 1 / 1")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/^(SUCCESS|FAILED)$/)).toBeVisible();
});
