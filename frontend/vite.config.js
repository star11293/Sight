import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend runs on 5173, Flask on 5001.
// Anything hitting /api gets proxied to Flask so theres no CORS mess in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
