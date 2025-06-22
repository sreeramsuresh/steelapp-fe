import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { open: true, port: 3030 },
  // base: "https://github.com/sreeramsuresh/steelapprnp.git",
});
