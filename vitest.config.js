import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    pool: "vmForks",
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ["src/**/*.{test,spec}.{js,jsx,mjs,ts,tsx}"],
    exclude: [
      "tests/e2e/**",
      "cypress/**",
      "node_modules/**",
      "**/*.node.test.mjs",
    ],
    server: {
      deps: {
        inline: ["html-encoding-sniffer", "@exodus/bytes"],
      },
    },
  },
});
