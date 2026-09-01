// Main process entry point - Electron backend

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { app, BrowserWindow, Menu, session } from "electron";

import { registerHandlers } from "./handlers/index.js";
import { getPreloadPath, getWindowUrl } from "./windows/window-paths.js";

// Content-Security-Policy for the renderer. Set as a response header here
// (rather than a <meta> tag in the HTML) because a meta-tag CSP with
// 'self' behaves unreliably once the app is loaded via a file:// URL (the
// packaged build) — it can silently block the app's own scripts/styles,
// leaving a blank window. Setting the header this way works the same in
// dev (http://localhost) and in the packaged app (file://).
const CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; " +
  "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; " +
  "media-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'none'";

function setupContentSecurityPolicy() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [CSP],
      },
    });
  });
}

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── IPC Handlers ──────────────────────────────────────────────────────
registerHandlers();

// ── State ─────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;

// ── Window creation ───────────────────────────────────────────────────
async function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return;
  }

  // Read display name from package.json
  // In production: __dirname = build/main, package.json is at ../../package.json
  const packageJsonPath = path.join(__dirname, "..", "..", "package.json");

  const minWindowWidth = 390;
  const minWindowHeight = 456;
  const windowWidth = 1000;
  const windowHeight = 700;
  let windowTitle = "LEVI";

  try {
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, "utf-8"));
      windowTitle = packageJson.productName || windowTitle;
    }
  } catch {
    // Use defaults
  }

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: minWindowWidth,
    minHeight: minWindowHeight,
    title: windowTitle,
    // macOS: inset traffic lights, content extends under the titlebar (see --titlebar-inset in styles.css)
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: process.platform === "darwin" ? { x: 18, y: 18 } : undefined,
    show: false, // Don't show until ready (prevents flickering)
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  const url = await getWindowUrl("main-window.html");

  await mainWindow.loadURL(url);
}

// ── Application menu ──────────────────────────────────────────────────
function setupApplicationMenu() {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.getName(),
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ── Lifecycle events ──────────────────────────────────────────────────
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else {
    mainWindow?.show();
  }
});

// ── App ready ─────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  setupApplicationMenu();
  setupContentSecurityPolicy();

  createMainWindow().catch((error) => {
    console.error("Failed to create main window", error);
  });
});
