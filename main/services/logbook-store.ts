import * as fs from "node:fs/promises";
import * as path from "node:path";
import { app } from "electron";

export interface LogbookProject {
  id: string;
  naam: string;
  lukIds: string[];
  skillIds: string[];
  aangemaaktOp: string;
}

export interface LogbookData {
  studentName: string;
  projects: LogbookProject[];
  completedProjects?: string[];
  skillData: Record<string, Record<string, { plan?: string; tips?: string[] }>>;
  entries: Array<{
    id: string;
    skillId: string;
    title: string;
    periode: string;
    date: string;
    description: string;
    reflection: string;
    actionItems: Array<{ id: string; text: string; done: boolean }>;
    status: string;
  }>;
  lukEntries: Array<{
    id: string;
    lukId: string;
    criterionId: string;
    periode: string;
    title?: string;
    text: string;
    files: Array<{ id: string; name: string; type: string; dataUrl: string; date: string }>;
    date?: string;
  }>;
  deadlines?: Array<{ id: string; title: string; date: string; projectKey?: string; done?: boolean }>;
  reflections?: Array<{ id: string; date: string; text: string }>;
}

const DEFAULT_DATA: LogbookData = {
  studentName: "",
  projects: [],
  completedProjects: [],
  skillData: {},
  entries: [],
  lukEntries: [],
  deadlines: [],
  reflections: [],
};

const DATA_FILE_NAME = "logbook-data.json";

// ─── Data location pointer ───────────────────────────────────────────────
//
// The user picks a folder for their logbook-data.json (setup screen, or
// later via Instellingen). We can't store *that choice* inside the data
// file itself, since we need to know where the data file is before we can
// read it — so a small pointer file lives in Electron's fixed, hidden
// userData folder and just holds the chosen folder's absolute path.

interface LocationPointer {
  folderPath: string;
}

function getPointerPath(): string {
  return path.join(app.getPath("userData"), "data-location.json");
}

export async function getStoredDataFolder(): Promise<string | null> {
  try {
    const raw = await fs.readFile(getPointerPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<LocationPointer>;
    return parsed.folderPath || null;
  } catch {
    return null;
  }
}

async function setStoredDataFolder(folderPath: string): Promise<void> {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(getPointerPath(), JSON.stringify({ folderPath } satisfies LocationPointer, null, 2));
}

/**
 * Checks whether a previously chosen data folder still exists and is
 * usable (readable/writable). Used on startup to decide whether to fall
 * back to the setup screen.
 */
export async function verifyDataFolder(folderPath: string): Promise<boolean> {
  try {
    await fs.access(folderPath, fs.constants.R_OK | fs.constants.W_OK);
    const stat = await fs.stat(folderPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function isFileNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";
}

class LogbookStore {
  private cache: LogbookData | null = null;
  private dataFolder: string | null = null;
  private saveQueue: Promise<void> = Promise.resolve();

  /** Absolute path to logbook-data.json in the currently configured folder. */
  private dataFilePath(): string {
    if (!this.dataFolder) {
      throw new Error("No data folder configured — call setDataFolder() first.");
    }
    return path.join(this.dataFolder, DATA_FILE_NAME);
  }

  /**
   * Resolves the folder to use, on first access: the folder the user
   * previously chose (from the pointer file), if it still exists.
   * Returns null if no folder has been chosen yet, or the chosen one is
   * no longer reachable — the renderer treats both as "needs setup".
   */
  async resolveConfiguredFolder(): Promise<string | null> {
    const stored = await getStoredDataFolder();
    if (!stored) return null;
    const ok = await verifyDataFolder(stored);
    if (!ok) return null;
    this.dataFolder = stored;
    return stored;
  }

  /**
   * Sets the active data folder (used right after the user picks one),
   * remembers the choice for next launch, and clears any cached data
   * from a previously configured folder.
   */
  async setDataFolder(folderPath: string): Promise<void> {
    await fs.mkdir(folderPath, { recursive: true });
    this.dataFolder = folderPath;
    this.cache = null;
    await setStoredDataFolder(folderPath);
  }

  getDataFolder(): string | null {
    return this.dataFolder;
  }

  async load(): Promise<LogbookData> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.dataFilePath(), "utf-8");
      const parsed = JSON.parse(raw) as Partial<LogbookData>;
      this.cache = {
        ...DEFAULT_DATA,
        ...parsed,
      } as LogbookData;
    } catch (error) {
      if (isFileNotFound(error)) {
        this.cache = { ...DEFAULT_DATA };
      } else {
        console.error(`[logbook-store] Failed to load data: ${error}`);
        throw error;
      }
    }
    return this.cache;
  }

  async save(data: LogbookData): Promise<void> {
    this.cache = data;
    const filePath = this.dataFilePath();
    const save = this.saveQueue
      .catch(() => undefined)
      .then(async () => {
        const tempPath = `${filePath}.${process.pid}.tmp`;
        try {
          await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
          await fs.rename(tempPath, filePath);
        } finally {
          await fs.rm(tempPath, { force: true });
        }
      });
    this.saveQueue = save;
    await save;
  }

  /**
   * Moves the data file (and its cache) from the current folder to a new
   * one, then switches the active folder. Used when the user changes the
   * storage location from Instellingen and wants to keep their data.
   */
  async moveTo(newFolderPath: string): Promise<void> {
    const data = await this.load();
    await this.setDataFolder(newFolderPath);
    await this.save(data);
  }
}

export const logbookStore = new LogbookStore();
