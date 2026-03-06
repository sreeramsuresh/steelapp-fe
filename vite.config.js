import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import { readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

function createProxy() {
  const target = "http://localhost:3000";
  const onProxyError = (err, _req, res) => {
    const msg = `[Proxy] Backend at ${target} is not reachable. Start it with: npm run gateway:dev`;
    console.error(`\x1b[31m${msg}\x1b[0m`);
    if (res && !res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Backend unavailable", message: msg }));
    }
  };
  const shared = { target, changeOrigin: true, secure: false };
  return {
    "/api": { ...shared, on: { error: onProxyError } },
    "/health": { ...shared, on: { error: onProxyError } },
    "/uploads": { ...shared, on: { error: onProxyError } },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: "stats.html", gzipSize: true }),
  ],
  // Strip console.log/info/debug from production builds (keep error/warn)
  esbuild: {
    pure: ["console.log", "console.info", "console.debug"],
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Open Chrome with remote debugging enabled (port 9222 for DevTools MCP)
    open: {
      app: {
        name: "chrome",
        arguments: ["--remote-debugging-port=9222"],
      },
    },
    port: 5173,
    host: "0.0.0.0",
    proxy: createProxy(),
    // Warmup critical files on server start (Vite >= 5.1)
    warmup: {
      clientFiles: [
        "./src/main.jsx",
        "./src/App.jsx",
        "./src/components/Login.jsx",
        "./src/contexts/ThemeContext.jsx",
        "./src/services/axiosAuthService.js",
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Only split echarts + zrender (self-contained, no React cycle risk).
        // Generic vendor splitting removed due to circular init deps
        // (vendor ↔ vendor-react "Cannot read properties of undefined").
        manualChunks(id) {
          if (id.includes("node_modules/echarts")) return "vendor-echarts";
          if (id.includes("node_modules/zrender")) return "vendor-zrender";
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Enable minification
    minify: "esbuild",
    // Keep chunk size warning at reasonable level
    chunkSizeWarningLimit: 550,
    // Enable source maps for debugging (can disable in production)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "date-fns",
      "lucide-react",
      "recharts",
      "react-hot-toast",
      "zod",
      "@radix-ui/react-select",
      "@radix-ui/react-dialog",
    ],
    // Exclude heavy libraries from pre-bundling to allow proper chunking
    exclude: ["jspdf", "html2canvas", "xlsx"],
  },
  // base: "https://github.com/sreeramsuresh/steelapprnp.git",
});
