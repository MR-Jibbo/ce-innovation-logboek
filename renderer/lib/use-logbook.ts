import { useState, useEffect, useCallback, useRef } from "react";
import type {
  AppState,
  Entry,
  LukEntry,
  ModalState,
  ViewName,
  VisibleProjects,
  OpenYears,
  Deadline,
  Reflection,
  ProfilePhotoPosition,
} from "./types";
import { DEFAULT_PROJ_NAMES, YEAR_GROUPS, uid } from "./constants";

// Backend data shape (matches LogbookData in main/services/logbook-store.ts)
interface BackendData {
  projNames: string[];
  studentName: string;
  studieJaar: number;
  visibleProjects: { jaar1: number[]; jaar2: number[] } | null;
  projOnboarded: Record<string, boolean>;
  completedProjects?: string[];
  selectedSkillIds: Record<string, string[]>;
  lukSelections: Record<string, string[]>;
  skillData: Record<string, Record<string, { plan?: string; tips?: string[] }>>;
  entries: Entry[];
  lukEntries: LukEntry[];
  openYears: OpenYears;
  deadlines?: Deadline[];
  reflections?: Reflection[];
  profilePhoto?: string | null;
  profilePhotoPosition?: ProfilePhotoPosition;
}

/** BackendData with every optional field defaulted — the shape used once loaded data has been normalized. */
type NormalizedBackendData = Required<BackendData>;

const DEFAULT_STATE: AppState = {
  view: "setup",
  projIdx: 0,
  studentName: "",
  studieJaar: 1,
  visibleProjects: null,
  projNames: [...DEFAULT_PROJ_NAMES],
  projOnboarded: {},
  completedProjects: [],
  selectedSkillIds: {},
  lukSelections: {},
  skillData: {},
  entries: [],
  lukEntries: [],
  openYears: { jaar1: true, jaar2: false },
  deadlines: [],
  reflections: [],
  profilePhoto: null,
  profilePhotoPosition: { x: 50, y: 50 },
};

export function useLogbook() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [modal, setModal] = useState<ModalState>(null);
  const [loaded, setLoaded] = useState(false);
  const [dataFolder, setDataFolderState] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<"location" | "profile">("location");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: figure out if a data folder was already chosen (and still
  // exists). If not, the setup screen's first step asks the user to pick
  // one before we can load/save anything.
  useEffect(() => {
    (async () => {
      try {
        const folder = await window.glazeAPI.glaze.ipc.invoke<string | null>("logbook:resolveDataFolder");
        if (!folder) {
          setState((prev) => ({ ...prev, view: "setup" }));
          setSetupStep("location");
          setLoaded(true);
          return;
        }
        setDataFolderState(folder);
        const raw = await window.glazeAPI.glaze.ipc.invoke("logbook:load") as BackendData;
        const hasStudent = raw.studentName && raw.studentName.trim().length > 0;
        const normalized: NormalizedBackendData = {
          projNames: raw.projNames?.length ? raw.projNames : [...DEFAULT_PROJ_NAMES],
          studentName: raw.studentName || "",
          studieJaar: raw.studieJaar || 1,
          visibleProjects: raw.visibleProjects,
          projOnboarded: raw.projOnboarded || {},
          completedProjects: raw.completedProjects || [],
          selectedSkillIds: raw.selectedSkillIds || {},
          lukSelections: raw.lukSelections || {},
          skillData: raw.skillData || {},
          entries: raw.entries || [],
          lukEntries: raw.lukEntries || [],
          openYears: raw.openYears || { jaar1: true, jaar2: false },
          deadlines: raw.deadlines || [],
          reflections: raw.reflections || [],
          profilePhoto: raw.profilePhoto || null,
          profilePhotoPosition: raw.profilePhotoPosition || { x: 50, y: 50 },
        };
        const { data, changed } = migrateProjectKeys(normalized);
        setState({
          view: hasStudent ? "home" : "setup",
          projIdx: 0,
          ...data,
        });
        if (changed) {
          // Persist the migrated (index-based) keys right away, so the fix
          // survives even if the user closes the app before their next edit.
          window.glazeAPI.glaze.ipc.invoke("logbook:save", data).catch((e) =>
            console.error("Failed to persist project-key migration:", e),
          );
        }
        setSetupStep("profile");
      } catch (e) {
        console.error("Failed to load logbook data:", e);
      }
      setLoaded(true);
    })();
  }, []);

  // ─── Data folder (setup step 1 + Instellingen) ────────────────────────────
  const pickDataFolder = useCallback(async (): Promise<string | null> => {
    const result = await window.glazeAPI.glaze.ipc.invoke<{ canceled: boolean; folderPath?: string }>(
      "logbook:pickDataFolder",
    );
    if (result.canceled || !result.folderPath) return null;
    return result.folderPath;
  }, []);

  /** Used on first setup: no existing data to preserve, folder starts empty. */
  const confirmDataFolder = useCallback(async (folderPath: string) => {
    await window.glazeAPI.glaze.ipc.invoke("logbook:setDataFolder", folderPath);
    setDataFolderState(folderPath);
    setSetupStep("profile");
  }, []);

  /** Used from Instellingen: moves the existing logbook-data.json along. */
  const changeDataFolder = useCallback(async (folderPath: string) => {
    await window.glazeAPI.glaze.ipc.invoke("logbook:moveDataFolder", folderPath);
    setDataFolderState(folderPath);
  }, []);

  // Debounced save
  const save = useCallback((newState: AppState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const backendData: BackendData = {
        projNames: newState.projNames,
        studentName: newState.studentName,
        studieJaar: newState.studieJaar,
        visibleProjects: newState.visibleProjects,
        projOnboarded: newState.projOnboarded,
        completedProjects: newState.completedProjects,
        selectedSkillIds: newState.selectedSkillIds,
        lukSelections: newState.lukSelections,
        skillData: newState.skillData,
        entries: newState.entries,
        lukEntries: newState.lukEntries,
        openYears: newState.openYears,
        deadlines: newState.deadlines,
        reflections: newState.reflections,
        profilePhoto: newState.profilePhoto,
        profilePhotoPosition: newState.profilePhotoPosition,
      };
      try {
        await window.glazeAPI.glaze.ipc.invoke("logbook:save", backendData);
      } catch (e) {
        console.error("Failed to save logbook data:", e);
      }
    }, 300);
  }, []);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, [save]);

  // ─── Navigation helpers ──────────────────────────────────────────────────
  const navigate = useCallback((view: ViewName, projIdx?: number) => {
    setModal(null);
    update((prev) => ({
      ...prev,
      view,
      projIdx: projIdx !== undefined ? projIdx : prev.projIdx,
    }));
  }, [update]);

  /**
   * The stable storage key ("0".."8") of the currently open project — used
   * for entries/lukEntries/skillData/etc. Use curName() for display text.
   */
  const cur = useCallback(() => {
    return keyOfIndex(state.projIdx);
  }, [state.projIdx]);

  /** The display name of the currently open project (e.g. "Project 1"). */
  const curName = useCallback(() => {
    return pk(state.projNames, state.projIdx);
  }, [state.projNames, state.projIdx]);

  // ─── Setup ───────────────────────────────────────────────────────────────
  const completeSetup = useCallback((name: string, jaar: number) => {
    update((prev) => ({
      ...prev,
      studentName: name,
      studieJaar: jaar,
      view: "home",
      visibleProjects: prev.visibleProjects || {
        jaar1: jaar === 1 ? [0, 1, 2, 3, 4] : [],
        jaar2: jaar === 2 ? [5, 6, 7, 8] : [],
      },
    }));
  }, [update]);

  // ─── Project onboarding ───────────────────────────────────────────────────
  const completeOnboarding = useCallback((key: string, skillIds: string[], lukIds: string[]) => {
    update((prev) => ({
      ...prev,
      selectedSkillIds: { ...prev.selectedSkillIds, [key]: skillIds },
      lukSelections: { ...prev.lukSelections, [key]: lukIds },
      projOnboarded: { ...prev.projOnboarded, [key]: true },
    }));
  }, [update]);

  // ─── Settings ────────────────────────────────────────────────────────────
  const saveSettings = useCallback((name: string, jaar: number, visibleProjects: VisibleProjects) => {
    update((prev) => ({
      ...prev,
      studentName: name,
      studieJaar: jaar,
      visibleProjects,
    }));
  }, [update]);

  // ─── Project settings ─────────────────────────────────────────────────────
  /**
   * `idx` is the project's stable slot index — renaming a project only ever
   * changes projNames[idx]; all keyed data (skills/LUKs/entries/...) already
   * lives under the stable key(idx), so there is nothing to migrate.
   */
  const saveProjectSettings = useCallback((idx: number, newName: string, skillIds: string[], lukIds: string[]) => {
    const key = keyOfIndex(idx);
    update((prev) => {
      const next = { ...prev };
      const trimmed = newName.trim();
      if (trimmed && trimmed !== next.projNames[idx]) {
        next.projNames = [...next.projNames];
        next.projNames[idx] = trimmed;
      }
      next.selectedSkillIds = { ...next.selectedSkillIds, [key]: skillIds };
      next.lukSelections = { ...next.lukSelections, [key]: lukIds };
      next.projOnboarded = { ...next.projOnboarded, [key]: true };
      return next;
    });
  }, [update]);

  // ─── Entries (ontwikkelmomenten) ──────────────────────────────────────────
  const addEntry = useCallback((entry: Omit<Entry, "id">) => {
    update((prev) => ({
      ...prev,
      entries: [...prev.entries, { ...entry, id: uid("e") }],
    }));
  }, [update]);

  const updateEntry = useCallback((id: string, patch: Partial<Entry>) => {
    update((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => e.id === id ? { ...e, ...patch } : e),
    }));
  }, [update]);

  const deleteEntry = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
    }));
  }, [update]);

  const toggleActionItem = useCallback((entryId: string, itemId: string) => {
    update((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => e.id === entryId ? {
        ...e,
        actionItems: e.actionItems.map((a) => a.id === itemId ? { ...a, done: !a.done } : a),
      } : e),
    }));
  }, [update]);

  // ─── LUK entries (bewijsstukken) ──────────────────────────────────────────
  const addLukEntry = useCallback((entry: Omit<LukEntry, "id">) => {
    update((prev) => ({
      ...prev,
      // Auto-stamp a creation date (ISO, like Entry.date) so bewijsstukken
      // can be placed in the dashboard's "Recente activiteiten" feed.
      lukEntries: [...prev.lukEntries, { ...entry, id: uid("le"), date: entry.date || new Date().toISOString().slice(0, 10) }],
    }));
  }, [update]);

  const updateLukEntry = useCallback((id: string, patch: Partial<LukEntry>) => {
    update((prev) => ({
      ...prev,
      lukEntries: prev.lukEntries.map((e) => e.id === id ? { ...e, ...patch } : e),
    }));
  }, [update]);

  const deleteLukEntry = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      lukEntries: prev.lukEntries.filter((e) => e.id !== id),
    }));
  }, [update]);

  // ─── Skill data (ontwikkelplan) ───────────────────────────────────────────
  const updateSkillPlan = useCallback((periode: string, skillId: string, plan: string) => {
    update((prev) => ({
      ...prev,
      skillData: {
        ...prev.skillData,
        [periode]: {
          ...prev.skillData[periode],
          [skillId]: {
            ...prev.skillData[periode]?.[skillId],
            plan,
          },
        },
      },
    }));
  }, [update]);

  // ─── Planning (deadlines) ──────────────────────────────────────────────────
  const addDeadline = useCallback((deadline: Omit<Deadline, "id">) => {
    update((prev) => ({
      ...prev,
      deadlines: [...(prev.deadlines || []), { ...deadline, id: uid("d") }],
    }));
  }, [update]);

  const updateDeadline = useCallback((id: string, patch: Partial<Deadline>) => {
    update((prev) => ({
      ...prev,
      deadlines: (prev.deadlines || []).map((d) => d.id === id ? { ...d, ...patch } : d),
    }));
  }, [update]);

  const deleteDeadline = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      deadlines: (prev.deadlines || []).filter((d) => d.id !== id),
    }));
  }, [update]);

  const toggleDeadlineDone = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      deadlines: (prev.deadlines || []).map((d) => d.id === id ? { ...d, done: !d.done } : d),
    }));
  }, [update]);

  // ─── Reflectie ─────────────────────────────────────────────────────────────
  const addReflection = useCallback((reflection: Omit<Reflection, "id">) => {
    update((prev) => ({
      ...prev,
      reflections: [...(prev.reflections || []), { ...reflection, id: uid("r") }],
    }));
  }, [update]);

  const updateReflection = useCallback((id: string, patch: Partial<Reflection>) => {
    update((prev) => ({
      ...prev,
      reflections: (prev.reflections || []).map((r) => r.id === id ? { ...r, ...patch } : r),
    }));
  }, [update]);

  const deleteReflection = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      reflections: (prev.reflections || []).filter((r) => r.id !== id),
    }));
  }, [update]);

  // ─── Profiel ────────────────────────────────────────────────────────────────
  const setProfilePhoto = useCallback((dataUrl: string | null) => {
    update((prev) => ({ ...prev, profilePhoto: dataUrl }));
  }, [update]);

  const setProfilePhotoPosition = useCallback((pos: { x: number; y: number }) => {
    update((prev) => ({ ...prev, profilePhotoPosition: pos }));
  }, [update]);

  // ─── Project afronden ──────────────────────────────────────────────────────
  /** Marks a project as completed, keeping all its data exactly as-is. */
  const completeProject = useCallback((key: string) => {
    update((prev) => ({
      ...prev,
      completedProjects: prev.completedProjects.includes(key)
        ? prev.completedProjects
        : [...prev.completedProjects, key],
    }));
  }, [update]);

  /** Moves a completed project back to "Gestarte projecten". */
  const reopenProject = useCallback((key: string) => {
    update((prev) => ({
      ...prev,
      completedProjects: prev.completedProjects.filter((k) => k !== key),
    }));
  }, [update]);

  /**
   * Wipes a project's data (ontwikkelmomenten, bewijsstukken, ontwikkelplan,
   * skill-/LUK-keuzes) and puts it back to "nog niet gestart" — used as the
   * alternative to "alles laten staan" when afronden a project.
   */
  const resetProject = useCallback((key: string) => {
    update((prev) => {
      const next = { ...prev };
      next.completedProjects = next.completedProjects.filter((k) => k !== key);
      next.projOnboarded = { ...next.projOnboarded };
      delete next.projOnboarded[key];
      next.selectedSkillIds = { ...next.selectedSkillIds };
      delete next.selectedSkillIds[key];
      next.lukSelections = { ...next.lukSelections };
      delete next.lukSelections[key];
      next.skillData = { ...next.skillData };
      delete next.skillData[key];
      next.entries = next.entries.filter((e) => e.periode !== key);
      next.lukEntries = next.lukEntries.filter((e) => e.periode !== key);
      return next;
    });
  }, [update]);

  // ─── Sidebar year toggle ──────────────────────────────────────────────────
  const toggleYear = useCallback((yearId: "jaar1" | "jaar2") => {
    update((prev) => {
      const wasOpen = prev.openYears[yearId];
      const openYears: OpenYears = { jaar1: false, jaar2: false };
      if (!wasOpen) openYears[yearId] = true;
      return { ...prev, openYears };
    });
  }, [update]);

  // ─── PDF export ───────────────────────────────────────────────────────────
  const exportPdf = useCallback(async (projectKey: string) => {
    const backendData: BackendData = {
      projNames: state.projNames,
      studentName: state.studentName,
      studieJaar: state.studieJaar,
      visibleProjects: state.visibleProjects,
      projOnboarded: state.projOnboarded,
      selectedSkillIds: state.selectedSkillIds,
      lukSelections: state.lukSelections,
      skillData: state.skillData,
      entries: state.entries,
      lukEntries: state.lukEntries,
      openYears: state.openYears,
    };
    return await window.glazeAPI.glaze.ipc.invoke("logbook:exportPdf", backendData, projectKey);
  }, [state]);

  // ─── Word export ──────────────────────────────────────────────────────────
  const exportWord = useCallback(async (projectKey: string) => {
    const backendData: BackendData = {
      projNames: state.projNames,
      studentName: state.studentName,
      studieJaar: state.studieJaar,
      visibleProjects: state.visibleProjects,
      projOnboarded: state.projOnboarded,
      selectedSkillIds: state.selectedSkillIds,
      lukSelections: state.lukSelections,
      skillData: state.skillData,
      entries: state.entries,
      lukEntries: state.lukEntries,
      openYears: state.openYears,
    };
    return await window.glazeAPI.glaze.ipc.invoke("logbook:exportWord", backendData, projectKey);
  }, [state]);

  return {
    state,
    modal,
    setModal,
    loaded,
    navigate,
    cur,
    curName,
    completeSetup,
    completeOnboarding,
    saveSettings,
    saveProjectSettings,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleActionItem,
    addLukEntry,
    updateLukEntry,
    deleteLukEntry,
    updateSkillPlan,
    addDeadline,
    updateDeadline,
    deleteDeadline,
    toggleDeadlineDone,
    addReflection,
    updateReflection,
    deleteReflection,
    setProfilePhoto,
    setProfilePhotoPosition,
    completeProject,
    reopenProject,
    resetProject,
    toggleYear,
    exportPdf,
    exportWord,
    dataFolder,
    setupStep,
    pickDataFolder,
    confirmDataFolder,
    changeDataFolder,
  };
}

export type LogbookContext = ReturnType<typeof useLogbook>;

// Helper functions

/** Display name of a project slot, by its index in projNames. */
export function pk(projNames: string[], i: number): string {
  return projNames[i] || `Project ${i + 1}`;
}

/**
 * The stable storage key for a project slot — used for Entry.periode,
 * LukEntry.periode, Deadline.projectKey, and as the Record key in
 * projOnboarded/selectedSkillIds/lukSelections/skillData/completedProjects.
 * Deliberately index-based (not the display name): two projects in
 * different years can share a display name (e.g. both left at the default
 * "Project 1"), and a name can change via Projectinstellingen, but the
 * slot's index never does.
 */
export function keyOfIndex(i: number): string {
  return String(i);
}

/** Reverse of keyOfIndex — parses a stable storage key back to its index, or -1 if invalid/unset. */
export function indexOfKey(key: string | undefined | null): number {
  if (!key || !/^\d+$/.test(key)) return -1;
  return parseInt(key, 10);
}

/** Which studiejaar a project slot (by its index in projNames) belongs to. */
export function yearOfIndex(i: number): 1 | 2 {
  return i < 5 ? 1 : 2;
}

/** " (Jaar 1)" / " (Jaar 2)" suffix for a stored project key, or "" if unset/invalid. */
export function yearSuffix(key: string | undefined): string {
  const idx = indexOfKey(key);
  return idx >= 0 ? ` (Jaar ${yearOfIndex(idx)})` : "";
}

/**
 * Migrates legacy data that was keyed by project DISPLAY NAME (the format
 * used before this fix) to the stable index-based key. Old name-keying
 * meant a Jaar 1 and Jaar 2 project sharing a name (e.g. both still named
 * "Project 1") collided: a bewijsstuk logged under one showed up under the
 * other too. Ambiguous legacy names resolve to their first matching index
 * (i.e. the Jaar 1 slot) — the original index can't be recovered since it
 * was never stored. Idempotent: already-migrated keys don't match any
 * project name and pass through unchanged, so this is safe to run on
 * every load.
 */
export function migrateProjectKeys(data: NormalizedBackendData): { data: NormalizedBackendData; changed: boolean } {
  const projNames = data.projNames?.length ? data.projNames : DEFAULT_PROJ_NAMES;
  let changed = false;
  const resolve = (name: string): string => {
    const idx = projNames.indexOf(name);
    if (idx < 0) return name;
    changed = true;
    return keyOfIndex(idx);
  };
  const remapRecord = <T,>(rec: Record<string, T>): Record<string, T> => {
    const out: Record<string, T> = {};
    for (const [k, v] of Object.entries(rec)) out[resolve(k)] = v;
    return out;
  };

  const next: NormalizedBackendData = {
    ...data,
    projOnboarded: remapRecord(data.projOnboarded),
    selectedSkillIds: remapRecord(data.selectedSkillIds),
    lukSelections: remapRecord(data.lukSelections),
    skillData: remapRecord(data.skillData),
    completedProjects: (data.completedProjects || []).map(resolve),
    entries: data.entries.map((e) => (e.periode ? { ...e, periode: resolve(e.periode) } : e)),
    lukEntries: data.lukEntries.map((e) => (e.periode ? { ...e, periode: resolve(e.periode) } : e)),
    deadlines: (data.deadlines || []).map((d) => (d.projectKey ? { ...d, projectKey: resolve(d.projectKey) } : d)),
  };
  return { data: next, changed };
}

/** Days until an ISO date (negative if in the past, 0 if today). */
export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Human-readable "over X dagen" / "vandaag" / "X dagen geleden" label. */
export function daysUntilLabel(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d === 0) return "vandaag";
  if (d === 1) return "morgen";
  if (d === -1) return "gisteren";
  if (d > 1) return `over ${d} dagen`;
  return `${Math.abs(d)} dagen geleden`;
}

export function getGreeting(name: string): string {
  const h = new Date().getHours();
  const g = h >= 6 && h < 12 ? "Goedemorgen" : h >= 12 && h < 18 ? "Goedemiddag" : "Goedenavond";
  return name ? `${g}, ${name}` : g;
}

export { YEAR_GROUPS };
