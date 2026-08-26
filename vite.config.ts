import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsConfigPaths from "vite-tsconfig-paths";

/** Stable id per deploy — prefer git SHA on Vercel, else timestamp. */
function resolveBuildId(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.CF_PAGES_COMMIT_SHA?.trim() ||
    process.env.COMMIT_REF?.trim() ||
    `b${Date.now().toString(36)}`
  );
}

/** Writes dist/version.json so clients can detect a new deploy without a full SW cycle. */
function appVersionPlugin(buildId: string): Plugin {
  const payload = JSON.stringify(
    { buildId, builtAt: new Date().toISOString() },
    null,
    0,
  );
  return {
    name: "feezo-app-version",
    apply: "build",
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir || resolve(process.cwd(), "dist");
      writeFileSync(resolve(outDir, "version.json"), payload, "utf8");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = (
    env.VITE_API_BASE_URL?.trim() || "https://api.feezo.app"
  ).replace(/\/$/, "");
  const apiProxySecure = apiProxyTarget.startsWith("https://");
  const buildId = resolveBuildId();

  return {
  define: {
    __APP_BUILD_ID__: JSON.stringify(mode === "production" ? buildId : "dev"),
  },
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
      // Leftover same-origin /api calls (e.g. WhatsApp proxy sibling) still
      // forward to the production Hostinger API — never local PHP.
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: apiProxySecure,
        timeout: 30_000,
        proxyTimeout: 30_000,
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
    appVersionPlugin(buildId),
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
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/manifest\.webmanifest$/,
          /^\/version\.json$/,
          /^\/sw\.js$/,
          /^\/workbox-.*\.js$/,
        ],
        runtimeCaching: [
          {
            // Always hit the network for deploy version — never serve stale build id.
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && url.pathname === "/version.json",
            handler: "NetworkOnly",
            options: {
              cacheName: "app-version-network-only",
            },
          },
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
            // Only same-origin /api — never intercept https://api.feezo.app (breaks CORS in the SW).
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
};
});
