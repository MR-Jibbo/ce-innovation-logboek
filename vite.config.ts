import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Builds the renderer (main-window.html) into build/.
// The preload script is built separately via vite.preload.config.ts
// because it needs to run inside Electron's isolated preload context
// (CommonJS, not an ES module served over HTTP).
export default defineConfig({
  root: ".",
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "build",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        "main-window": "./main-window.html",
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
