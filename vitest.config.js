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
    pool: "forks",
    poolOptions: {
      forks: {
        memoryLimit: "2048MB",
      },
    },
    fileParallelism: false,
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
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.test.{js,jsx}",
        "src/**/*.spec.{js,jsx}",
        "src/main.jsx",
      ],
      thresholds: {
        branches: 40,
        functions: 40,
        lines: 40,
        statements: 40,
      },
    },
    server: {
      deps: {
        inline: ["html-encoding-sniffer", "@exodus/bytes", /react-router/],
      },
    },
  },
});
