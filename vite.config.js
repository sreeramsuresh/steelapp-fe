import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    proxy: {
      // Proxy API calls to backend to avoid CORS/CORB and HTML responses
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      // Also proxy static uploads to serve images from same origin
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
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
        // manualChunks removed — Rollup's default splitting avoids
        // circular init dependencies (e.g. vendor ↔ vendor-react cycle
        // that caused "Cannot read properties of undefined (reading 'memo')"
        // at runtime). React.lazy() already code-splits route components.
      },
    },
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Enable minification
    minify: "esbuild",
    // Keep chunk size warning at reasonable level
    chunkSizeWarningLimit: 500,
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
