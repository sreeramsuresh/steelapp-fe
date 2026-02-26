import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    pool: "vmForks",
    maxWorkers: 4,
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ["src/test/setup.js"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    exclude: [
      "tests/e2e/**",
      "cypress/**",
      "node_modules/**",
      // All .mjs test files use node:test (Node built-in runner) — not vitest-compatible
      "**/*.test.mjs",
      "**/*.spec.mjs",
      "**/*.node.test.mjs",
    ],
    server: {
      deps: {
        inline: ["html-encoding-sniffer", "@exodus/bytes", /react-router/],
      },
    },
  },
});
