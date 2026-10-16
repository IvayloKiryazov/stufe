import { defineConfig } from "@playwright/test";

// Runs the built app (vite preview serves ../docs).
export default defineConfig({
  testDir: "./e2e",
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
