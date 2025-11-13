import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
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
  },
  // base: "https://github.com/sreeramsuresh/steelapprnp.git",
});
