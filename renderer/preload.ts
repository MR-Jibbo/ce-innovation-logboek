/**
 * Electron Preload Script
 *
 * Runs in an isolated context before the renderer loads. Exposes a small,
 * explicit API on window.glazeAPI (kept as the same global name the app's
 * renderer code already uses) so the renderer never touches ipcRenderer
 * directly.
 */

import { contextBridge, ipcRenderer } from "electron";
import type { SaveDialogOptions, SaveDialogReturnValue } from "electron";

const glazeAPI = {
  dialog: {
    showSaveDialog: (options?: SaveDialogOptions): Promise<SaveDialogReturnValue> =>
      ipcRenderer.invoke("dialog:showSaveDialog", options),
  },

  glaze: {
    ipc: {
      invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> =>
        ipcRenderer.invoke(channel, ...args),
    },
  },
};

contextBridge.exposeInMainWorld("glazeAPI", glazeAPI);

export type GlazeAPI = typeof glazeAPI;
