import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Fetch a new service worker + assets in the background and swap them in
      // automatically on the next load — no "new version available" prompt.
      registerType: "autoUpdate",
      // Precache these static files from /public alongside the built assets so
      // the icons/favicon are available offline too.
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Our Dates",
        short_name: "Dates",
        description: "Our private date tracker",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
