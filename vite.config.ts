// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import viteImagemin from "vite-plugin-imagemin";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: { preset: "vercel" },
  vite: {
    plugins: [
      viteImagemin({
        // Disable formats we don't need to speed up build
        gifsicle: false,
        optipng: false,
        svgo: false,
        // Compress JPEGs — quality 82 balances size vs visual quality
        mozjpeg: { quality: 82, progressive: true },
        // Compress PNGs — covers logo.png which is 194 KB
        pngquant: { quality: [0.65, 0.85], speed: 4, strip: true },
        // Also generate WebP where supported — browser picks via <picture> if used
        webp: { quality: 80 },
      }),
    ],
    build: {
      // Inline small assets < 4 KB to eliminate extra requests
      assetsInlineLimit: 4096,
    },
  },
});
