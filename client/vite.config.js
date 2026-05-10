import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon.svg",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
        "icons/apple-touch-icon.png",
      ],
      manifest: {
        name: "SmartSwaasth",
        short_name: "SmartSwaasth",
        description:
          "Your Smart Medication Manager — scan labels, track expiry, get reminders",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#06b6d4",
        orientation: "portrait-primary",
        categories: ["health", "medical", "lifestyle"],
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Scan Medicine",
            short_name: "Scan",
            url: "/scan",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Dashboard",
            short_name: "Dashboard",
            url: "/dashboard",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        importScripts: ["/sw-push.js"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/uploads\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "uploads-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Inject custom push notification handlers into the service worker
      injectManifest: undefined,
    }),
  ],
  server: { port: 5173 },
});
