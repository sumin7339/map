import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api/geocode": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geocode/, "/search"),
        headers: {
          "User-Agent": "GileumRouteFinder/1.0 (local development)",
        },
      },
    },
  },
});
