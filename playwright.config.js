// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8000",
  },
  webServer: {
    command: "python3 -m http.server 8000",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
