import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    // Phase 5.2 fix: Single-threaded mode eliminates worker pool exhaustion
    // All tests run in main thread sequentially - prevents timeouts and resource issues
    threads: {
      singleThread: true,
    },
    // Ensure sequential execution
    sequence: {
      concurrent: false,
    },
    // Disable API requests during tests
    env: {
      VITE_API_BASE_URL: "/api",
      VITE_DISABLE_CONTRACT_VALIDATION: "true",
      VITE_REFRESH_ENDPOINT: "/auth/refresh-token",
    },
    // Coverage configuration for Phase 1: 100% test coverage initiative
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      all: true,
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: [
        "src/**/*.test.{js,jsx,ts,tsx}",
        "src/**/*.spec.{js,jsx,ts,tsx}",
        "src/test/**",
        "src/**/__tests__/**",
        "node_modules/**",
        "dist/**",
      ],
      // Coverage thresholds for 100% test coverage initiative
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
