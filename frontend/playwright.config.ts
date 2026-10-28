import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3101",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/fixtures/posts-server.mjs",
      url: "http://127.0.0.1:4101/health",
    },
    {
      command:
        "npm run build && node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3101",
      url: "http://127.0.0.1:3101",
      // Reserved test-only destinations; never real profile configuration.
      env: { API_BASE_URL: "http://127.0.0.1:4101", SOCIAL_GITHUB_URL: "https://example.test/github", SOCIAL_LINKEDIN_URL: "javascript:alert(1)", SOCIAL_TWITTER_URL: "" },
      timeout: 120_000,
    },
  ],
});
