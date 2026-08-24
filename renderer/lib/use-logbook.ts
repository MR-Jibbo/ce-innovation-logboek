import { useState, useEffect, useCallback, useRef } from "react";
import type {
  AppState,
  Entry,
  LukEntry,
  ModalState,
  ViewName,
  VisibleProjects,
  OpenYears,
} from "./types";
import { DEFAULT_PROJ_NAMES, YEAR_GROUPS, uid } from "./constants";

// Backend data shape (matches LogbookData in main/services/logbook-store.ts)
interface BackendData {
  projNames: string[];
  studentName: string;
  studieJaar: number;
  visibleProjects: { jaar1: number[]; jaar2: number[] } | null;
  projOnboarded: Record<string, boolean>;
  selectedSkillIds: Record<string, string[]>;
  lukSelections: Record<string, string[]>;
  skillData: Record<string, Record<string, { plan?: string; tips?: string[] }>>;
  entries: Entry[];
  lukEntries: LukEntry[];
  openYears: OpenYears;
}

const DEFAULT_STATE: AppState = {
  view: "setup",
  projIdx: 0,
  studentName: "",
  studieJaar: 1,
  visibleProjects: null,
  projNames: [...DEFAULT_PROJ_NAMES],
  projOnboarded: {},
  selectedSkillIds: {},
  lukSelections: {},
  skillData: {},
  entries: [],
  lukEntries: [],
  openYears: { jaar1: true, jaar2: false },
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
        const data = await window.glazeAPI.glaze.ipc.invoke("logbook:load") as BackendData;
        const hasStudent = data.studentName && data.studentName.trim().length > 0;
        setState({
          view: hasStudent ? "home" : "setup",
          projIdx: 0,
          studentName: data.studentName || "",
          studieJaar: data.studieJaar || 1,
          visibleProjects: data.visibleProjects,
          projNames: data.projNames?.length ? data.projNames : [...DEFAULT_PROJ_NAMES],
          projOnboarded: data.projOnboarded || {},
          selectedSkillIds: data.selectedSkillIds || {},
          lukSelections: data.lukSelections || {},
          skillData: data.skillData || {},
          entries: data.entries || [],
          lukEntries: data.lukEntries || [],
          openYears: data.openYears || { jaar1: true, jaar2: false },
        });
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
        selectedSkillIds: newState.selectedSkillIds,
        lukSelections: newState.lukSelections,
        skillData: newState.skillData,
        entries: newState.entries,
        lukEntries: newState.lukEntries,
        openYears: newState.openYears,
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

  const cur = useCallback(() => {
    return state.projNames[state.projIdx] || `Project ${state.projIdx + 1}`;
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
  const saveProjectSettings = useCallback((oldKey: string, newKey: string, skillIds: string[], lukIds: string[]) => {
    update((prev) => {
      const next = { ...prev };
      const idx = next.projNames.indexOf(oldKey);
      const renamed = newKey !== oldKey;
      if (idx >= 0 && renamed) {
        next.projNames = [...next.projNames];
        next.projNames[idx] = newKey;
        // Migrate all keyed data
        for (const field of ["selectedSkillIds", "lukSelections", "skillData"] as const) {
          if ((next[field] as Record<string, unknown>)[oldKey]) {
            (next[field] as Record<string, unknown>)[newKey] = (next[field] as Record<string, unknown>)[oldKey];
            delete (next[field] as Record<string, unknown>)[oldKey];
          }
        }
        if (next.projOnboarded[oldKey]) {
          next.projOnboarded = { ...next.projOnboarded, [newKey]: next.projOnboarded[oldKey] };
          delete next.projOnboarded[oldKey];
        }
        next.entries = next.entries.map((e) => e.periode === oldKey ? { ...e, periode: newKey } : e);
        next.lukEntries = next.lukEntries.map((e) => e.periode === oldKey ? { ...e, periode: newKey } : e);
      }
      next.selectedSkillIds = { ...next.selectedSkillIds, [newKey]: skillIds };
      next.lukSelections = { ...next.lukSelections, [newKey]: lukIds };
      next.projOnboarded = { ...next.projOnboarded, [newKey]: true };
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
      lukEntries: [...prev.lukEntries, { ...entry, id: uid("le") }],
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
export function pk(projNames: string[], i: number): string {
  return projNames[i] || `Project ${i + 1}`;
}

export function getGreeting(name: string): string {
  const h = new Date().getHours();
  const g = h >= 6 && h < 12 ? "Goedemorgen" : h >= 12 && h < 18 ? "Goedemiddag" : "Goedenavond";
  return name ? `${g}, ${name}` : g;
}

export { YEAR_GROUPS };
