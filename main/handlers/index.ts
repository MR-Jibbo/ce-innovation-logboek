/**
 * Handler Registration
 *
 * Register all IPC handlers here
 */

import { ipcMain, dialog } from "electron";

import { appHandlers } from "./app.js";
import { logbookStore, type LogbookData } from "../services/logbook-store.js";
import { exportLogbookPdf, exportLogbookWord, SKILL_DEFS_BACKEND, LUK_DEFS_BACKEND } from "../services/pdf-export.js";

export function registerHandlers(): void {
  ipcMain.handle("app:getInfo", async (_event) => {
    return await appHandlers.getInfo();
  });

  // ─── Data folder handlers ─────────────────────────────────────────────────
  // Resolves the previously chosen folder (if any and still reachable).
  // Returns null when the user still needs to pick one (first run, or the
  // previously chosen folder is gone) — the renderer shows the setup screen.
  ipcMain.handle("logbook:resolveDataFolder", async () => {
    return await logbookStore.resolveConfiguredFolder();
  });

  // Opens a native folder picker so the user can choose where their data lives.
  ipcMain.handle("logbook:pickDataFolder", async () => {
    const result = await dialog.showOpenDialog({
      title: "Kies een map voor je logboekgegevens",
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || !result.filePaths[0]) {
      return { canceled: true as const };
    }
    return { canceled: false as const, folderPath: result.filePaths[0] };
  });

  // Sets the active folder for a fresh setup (no existing data to migrate).
  ipcMain.handle("logbook:setDataFolder", async (_event, folderPath: string) => {
    await logbookStore.setDataFolder(folderPath);
    return { success: true };
  });

  // Moves existing data to a new folder (used from Instellingen).
  ipcMain.handle("logbook:moveDataFolder", async (_event, folderPath: string) => {
    await logbookStore.moveTo(folderPath);
    return { success: true };
  });

  ipcMain.handle("logbook:getDataFolder", async () => {
    return logbookStore.getDataFolder();
  });

  // ─── Logbook data handlers ───────────────────────────────────────────────
  ipcMain.handle("logbook:load", async () => {
    return await logbookStore.load();
  });

  ipcMain.handle("logbook:save", async (_event, data: LogbookData) => {
    await logbookStore.save(data);
    return { success: true };
  });

  ipcMain.handle("logbook:exportPdf", async (_event, data: LogbookData, projectKey: string) => {
    return await exportLogbookPdf(data, SKILL_DEFS_BACKEND, LUK_DEFS_BACKEND, projectKey);
  });

  ipcMain.handle("logbook:exportWord", async (_event, data: LogbookData, projectKey: string) => {
    return await exportLogbookWord(data, SKILL_DEFS_BACKEND, LUK_DEFS_BACKEND, projectKey);
  });

  // ─── Native dialog passthrough (used by preload's dialog.* bridge) ───────
  ipcMain.handle("dialog:showSaveDialog", async (_event, options) => {
    return await dialog.showSaveDialog(options);
  });
}
