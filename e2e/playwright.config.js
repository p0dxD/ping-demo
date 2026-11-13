// Browser tests of the pinger. They point at BASE_URL: rendimiento sets it
// (the live release's address, or a pull request's copy); on your computer,
// http://localhost:5173 with `npm run dev` in frontend/.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "pruebas",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: process.env.BASE_URL || "http://localhost:5173", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
