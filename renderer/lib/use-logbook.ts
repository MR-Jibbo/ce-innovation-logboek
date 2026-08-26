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
          completedProjects: data.completedProjects || [],
          selectedSkillIds: data.selectedSkillIds || {},
          lukSelections: data.lukSelections || {},
          skillData: data.skillData || {},
          entries: data.entries || [],
          lukEntries: data.lukEntries || [],
          openYears: data.openYears || { jaar1: true, jaar2: false },
          deadlines: data.deadlines || [],
          reflections: data.reflections || [],
          profilePhoto: data.profilePhoto || null,
          profilePhotoPosition: data.profilePhotoPosition || { x: 50, y: 50 },
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
export function pk(projNames: string[], i: number): string {
  return projNames[i] || `Project ${i + 1}`;
}

/** Which studiejaar a project slot (by its index in projNames) belongs to. */
export function yearOfIndex(i: number): 1 | 2 {
  return i < 5 ? 1 : 2;
}

/**
 * Which studiejaar a project *name* belongs to — for places that only have
 * the stored key (e.g. Entry.periode, Deadline.projectKey), not the original
 * index. Falls back to the first matching index, so this can be ambiguous
 * if a Jaar 1 and Jaar 2 project happen to share the exact same name (e.g.
 * both left at the default "Project 1") — a pre-existing quirk of keying
 * data by name instead of index.
 */
export function yearOfProjectName(projNames: string[], name: string | undefined): 1 | 2 | null {
  if (!name) return null;
  const idx = projNames.indexOf(name);
  return idx >= 0 ? yearOfIndex(idx) : null;
}

/** " (Jaar 1)" / " (Jaar 2)" suffix for a project name, or "" if unknown. */
export function yearSuffix(projNames: string[], name: string | undefined): string {
  const y = yearOfProjectName(projNames, name);
  return y ? ` (Jaar ${y})` : "";
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
