import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Must be listed before the catch-all `/api` proxy.
      "/api/bugricer-whatsapp": {
        target: "https://notifyapi.bugricer.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/bugricer-whatsapp/, "/wapp/api"),
      },
      // Same-origin API in DEV — avoids browser CORS + SW cross-origin issues.
      "/api": {
        target: "https://spi.macadz.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    viteReact(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icons/**/*"],
      manifest: {
        name: "Feezo",
        short_name: "Feezo",
        description:
          "Multi-tenant school management for students, staff, finance, and settings.",
        theme_color: "#0F766E",
        background_color: "#EAEAEA",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        lang: "en",
        categories: ["education", "business", "productivity"],
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Only same-origin /api — never intercept https://spi.macadz.com (breaks CORS in the SW).
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
            options: {
              cacheName: "api-network-only",
            },
          },
        ],
      },
      devOptions: {
        // Keep SW off in DEV by default — it was intercepting cross-origin API and
        // surfacing false CORS errors. Enable with VITE_PWA_DEV=1 when testing install.
        enabled: process.env.VITE_PWA_DEV === "1",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          router: ["@tanstack/react-router", "@tanstack/react-query"],
        },
      },
    },
  },
});
