import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the SPA into ../docs so GitHub Pages can serve it.
// base "./" + HashRouter keep deep links working on a project Pages site.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
  server: { port: 5173 },
});
