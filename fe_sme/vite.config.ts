import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: "globalThis",
  },
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://sme-7aido.ondigitalocean.app",
        // target: "http://localhost:8080",
        changeOrigin: true,
      },
      // WebSocket proxy — only active when running against a local backend.
      // Production uses VITE_API_BASE_URL directly (SockJS connects over HTTPS).
      // "/ws": {
      //   target: "http://localhost:8080",
      //   ws: true,
      //   changeOrigin: true,
      // },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@core": fileURLToPath(new URL("./src/core", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
