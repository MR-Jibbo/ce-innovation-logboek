import { defineConfig } from "vite";

// Builds renderer/preload.ts into build/main/preload.js as a CommonJS
// bundle, which is what Electron's webPreferences.preload expects.
export default defineConfig({
  build: {
    outDir: "build/main",
    emptyOutDir: false,
    lib: {
      entry: "renderer/preload.ts",
      formats: ["cjs"],
      fileName: () => "preload.js",
    },
    rollupOptions: {
      external: ["electron"],
    },
    minify: false,
  },
});
