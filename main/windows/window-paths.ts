import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

// Backend is at build/main/index.js, HTML is at build/index.html
// So we go up one level from build/main/ to build/
const BUILD_ROOT = path.resolve(currentDirPath, "..");

/**
 * Absolute path to the build directory that contains HTML entry points.
 */
export function getBuildRoot(): string {
  return BUILD_ROOT;
}

/**
 * Resolve the on-disk HTML file for a given window.
 */
export function resolveWindowHtml(htmlFileName: string): string {
  return path.join(BUILD_ROOT, htmlFileName);
}

/**
 * Return a file:// URL for a locally built HTML file.
 */
export function getWindowFileUrl(htmlFileName: string): string {
  return pathToFileURL(resolveWindowHtml(htmlFileName)).toString();
}

/**
 * Absolute path to the built preload script.
 */
export function getPreloadPath(): string {
  return path.join(BUILD_ROOT, "main", "preload.js");
}

/**
 * Resolve the correct URL for a window. In dev, Vite serves from a dev
 * server URL (passed via VITE_DEV_SERVER_URL); in production we load the
 * built HTML file directly.
 */
export async function getWindowUrl(htmlFileName: string): Promise<string> {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    return `${devServerUrl}/${htmlFileName}`;
  }

  return getWindowFileUrl(htmlFileName);
}
