import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "dashboard.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3102",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: [
    { command: "node tests/fixtures/posts-server.mjs", url: "http://127.0.0.1:4101/health" },
    {
      command: "node tests/dashboard-preview/prepare.mjs && node node_modules/next/dist/bin/next build tests/dashboard-preview && node node_modules/next/dist/bin/next start tests/dashboard-preview --hostname 127.0.0.1 --port 3102",
      url: "http://127.0.0.1:3102/dashboard",
      env: { API_BASE_URL: "http://127.0.0.1:4101" },
      timeout: 120_000,
    },
  ],
});
