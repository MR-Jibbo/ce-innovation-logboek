import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite adds a `crossorigin` attribute to the built <script type="module">
// and <link> tags by default. That's correct for an http(s) dev/prod
// server, but the packaged app loads main-window.html via a file:// URL
// (see main/index.ts -> loadURL). Under file://, each load is an opaque
// ("null") origin, so a CORS-mode ("crossorigin") request to it fails
// silently — the script tag is present but never executes, the root
// component never mounts, and the window just shows blank/white with no
// visible error. Stripping the attribute at build time fixes this.
function stripCrossoriginForFileProtocol() {
  return {
    name: "strip-crossorigin-for-file-protocol",
    transformIndexHtml(html: string) {
      return html.replace(/\s+crossorigin(="[^"]*")?/g, "");
    },
  };
}

// Builds the renderer (main-window.html) into build/.
// The preload script is built separately via vite.preload.config.ts
// because it needs to run inside Electron's isolated preload context
// (CommonJS, not an ES module served over HTTP).
export default defineConfig({
  root: ".",
  base: "./",
  plugins: [react(), tailwindcss(), stripCrossoriginForFileProtocol()],
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
