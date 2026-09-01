/**
 * Hulpmiddelen — de 18 statische procesmodel-PDF's die met de app worden
 * meegeleverd (zie resources/hulpmiddelen/ en package.json's
 * build.extraResources). Alle bestandstoegang gebeurt hier in het main
 * process, hetzelfde patroon als logbook-store.ts en pdf-export.ts.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { app, shell, dialog } from "electron";

/**
 * Absolute map met de hulpmiddelen-PDF's.
 *
 * In een gepakte app kopieert electron-builder's `extraResources` de map
 * naar process.resourcesPath/hulpmiddelen. In dev (`npm run dev` /
 * `electron .` zonder packaging) bestaat process.resourcesPath niet als
 * projectmap — extraResources wordt alleen door electron-builder toegepast —
 * dus dan lezen we rechtstreeks uit de projectmap resources/hulpmiddelen/.
 * Dit bestand compileert naar build/main/services/hulpmiddelen-store.js, dus
 * drie niveaus omhoog (services -> main -> build) is de projectroot.
 */
function hulpmiddelenDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "hulpmiddelen");
  }
  const currentDirPath = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDirPath, "..", "..", "..", "resources", "hulpmiddelen");
}

/** Voorkomt path traversal — alleen een kale bestandsnaam wordt geaccepteerd. */
function resolveSafe(bestandsnaam: string): string | null {
  if (!bestandsnaam || bestandsnaam.includes("/") || bestandsnaam.includes("\\") || bestandsnaam.includes("..")) {
    return null;
  }
  const filePath = path.join(hulpmiddelenDir(), bestandsnaam);
  if (!fs.existsSync(filePath)) return null;
  return filePath;
}

/**
 * "Bekijken" — opent de PDF in het systeem-standaardprogramma
 * (shell.openPath). Er is in deze app nog geen in-app PDF-viewer (de
 * bestaande pdfjs-dist-integratie leest alleen platte tekst uit PDF's voor
 * de export, ze wordt nergens gerenderd), dus dit sluit het beste aan bij
 * hoe de app PDF's nu al behandelt: als bestand, niet als iets dat ze zelf
 * weergeeft.
 */
export async function openHulpmiddel(bestandsnaam: string): Promise<{ success: boolean; error?: string }> {
  const filePath = resolveSafe(bestandsnaam);
  if (!filePath) {
    return { success: false, error: "Bestand niet gevonden." };
  }
  const result = await shell.openPath(filePath); // lege string bij succes, foutmelding anders
  if (result) {
    return { success: false, error: result };
  }
  return { success: true };
}

/**
 * "Downloaden" — vraagt via een save-dialog waar de PDF moet komen en
 * kopieert 'm vanuit de resources-map naar die locatie.
 */
export async function downloadHulpmiddel(
  bestandsnaam: string,
  suggestedName: string,
): Promise<{ success: boolean; canceled: boolean; filePath?: string; error?: string }> {
  const filePath = resolveSafe(bestandsnaam);
  if (!filePath) {
    return { success: false, canceled: false, error: "Bestand niet gevonden." };
  }

  const result = await dialog.showSaveDialog({
    title: "Hulpmiddel opslaan",
    defaultPath: suggestedName,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    await fs.promises.copyFile(filePath, result.filePath);
    return { success: true, canceled: false, filePath: result.filePath };
  } catch (e) {
    return { success: false, canceled: false, error: e instanceof Error ? e.message : String(e) };
  }
}
