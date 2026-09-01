import { useState, useEffect, useCallback, useRef } from "react";
import type {
  AppState,
  Entry,
  LukEntry,
  ModalState,
  ViewName,
  Deadline,
  Reflection,
  Project,
} from "./types";
import { uid } from "./constants";

// Backend data shape (matches LogbookData in main/services/logbook-store.ts)
interface BackendData {
  studentName: string;
  projects: Project[];
  completedProjects?: string[];
  skillData: Record<string, Record<string, { plan?: string; tips?: string[] }>>;
  entries: Entry[];
  lukEntries: LukEntry[];
  deadlines?: Deadline[];
  reflections?: Reflection[];
}

/** BackendData with every optional field defaulted — the shape used once loaded data has been normalized. */
type NormalizedBackendData = Required<BackendData>;

const DEFAULT_STATE: AppState = {
  view: "setup",
  projectId: null,
  studentName: "",
  projects: [],
  completedProjects: [],
  skillData: {},
  entries: [],
  lukEntries: [],
  deadlines: [],
  reflections: [],
};

export function useLogbook() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [modal, setModal] = useState<ModalState>(null);
  const [loaded, setLoaded] = useState(false);
  const [dataFolder, setDataFolderState] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<"location" | "profile">("location");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Bevestigingsanimatie ("confetti") ─────────────────────────────────────
  // A simple counter that ticks up each time a new ontwikkelmoment/bewijsstuk
  // is logged — HomeView watches it to briefly show a non-blocking celebration
  // burst. A counter (rather than a boolean) so two celebrations fired back to
  // back both register, even if the first animation hasn't finished yet.
  const [celebrateTick, setCelebrateTick] = useState(0);
  const triggerCelebration = useCallback(() => setCelebrateTick((t) => t + 1), []);

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
          studentName: raw.studentName || "",
          projects: raw.projects || [],
          completedProjects: raw.completedProjects || [],
          skillData: raw.skillData || {},
          entries: raw.entries || [],
          lukEntries: raw.lukEntries || [],
          deadlines: raw.deadlines || [],
          reflections: raw.reflections || [],
        };
        setState({
          view: hasStudent ? "home" : "setup",
          projectId: null,
          ...normalized,
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
        studentName: newState.studentName,
        projects: newState.projects,
        completedProjects: newState.completedProjects,
        skillData: newState.skillData,
        entries: newState.entries,
        lukEntries: newState.lukEntries,
        deadlines: newState.deadlines,
        reflections: newState.reflections,
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
  const navigate = useCallback((view: ViewName, projectId?: string) => {
    setModal(null);
    update((prev) => ({
      ...prev,
      view,
      projectId: projectId !== undefined ? projectId : prev.projectId,
    }));
  }, [update]);

  /** The id of the currently open project — used for entries/lukEntries/skillData/etc. Use curName() for display text. */
  const cur = useCallback(() => state.projectId || "", [state.projectId]);

  /** The currently open Project object, or undefined. */
  const curProject = useCallback(() => {
    return state.projects.find((p) => p.id === state.projectId);
  }, [state.projects, state.projectId]);

  /** The display name of the currently open project. */
  const curName = useCallback(() => {
    return projectName(state.projects, state.projectId);
  }, [state.projects, state.projectId]);

  // ─── Setup ───────────────────────────────────────────────────────────────
  const completeSetup = useCallback((name: string) => {
    update((prev) => ({
      ...prev,
      studentName: name,
      view: "home",
    }));
  }, [update]);

  // ─── Settings ────────────────────────────────────────────────────────────
  const saveSettings = useCallback((name: string) => {
    update((prev) => ({
      ...prev,
      studentName: name,
    }));
  }, [update]);

  // ─── Projects ──────────────────────────────────────────────────────────────
  /** Creates a new project (LUK required, skills optional) and opens it directly. */
  const createProject = useCallback((naam: string, lukIds: string[], skillIds: string[]) => {
    const project: Project = {
      id: uid("p"),
      naam,
      lukIds,
      skillIds,
      aangemaaktOp: new Date().toISOString().slice(0, 10),
    };
    update((prev) => ({
      ...prev,
      projects: [...prev.projects, project],
      view: "project",
      projectId: project.id,
    }));
  }, [update]);

  /** Updates a project's name, LUK-koppeling and skills (projectinstellingen). */
  const updateProjectSettings = useCallback((id: string, naam: string, lukIds: string[], skillIds: string[]) => {
    update((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => p.id === id ? { ...p, naam, lukIds, skillIds } : p),
    }));
  }, [update]);

  // ─── Entries (ontwikkelmomenten) ──────────────────────────────────────────
  const addEntry = useCallback((entry: Omit<Entry, "id">) => {
    update((prev) => ({
      ...prev,
      entries: [...prev.entries, { ...entry, id: uid("e"), createdAt: new Date().toISOString() }],
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
      // can be placed in the dashboard's "Recente activiteiten" feed, plus a
      // full timestamp for the relative "X geleden"-label.
      lukEntries: [...prev.lukEntries, { ...entry, id: uid("le"), date: entry.date || new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() }],
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

  /** Moves a completed project back to "Gestart". */
  const reopenProject = useCallback((key: string) => {
    update((prev) => ({
      ...prev,
      completedProjects: prev.completedProjects.filter((k) => k !== key),
    }));
  }, [update]);

  /**
   * Wipes a project's content (ontwikkelmomenten, bewijsstukken, ontwikkelplan)
   * and un-marks it as afgerond — the project itself (naam/LUK/skills-koppeling)
   * stays intact, since there's no more "not onboarded" state to revert to.
   */
  const resetProject = useCallback((key: string) => {
    update((prev) => {
      const next = { ...prev };
      next.completedProjects = next.completedProjects.filter((k) => k !== key);
      next.skillData = { ...next.skillData };
      delete next.skillData[key];
      next.entries = next.entries.filter((e) => e.periode !== key);
      next.lukEntries = next.lukEntries.filter((e) => e.periode !== key);
      return next;
    });
  }, [update]);

  // ─── PDF export ───────────────────────────────────────────────────────────
  const exportPdf = useCallback(async (projectKey: string) => {
    const backendData: BackendData = {
      studentName: state.studentName,
      projects: state.projects,
      completedProjects: state.completedProjects,
      skillData: state.skillData,
      entries: state.entries,
      lukEntries: state.lukEntries,
      deadlines: state.deadlines,
      reflections: state.reflections,
    };
    return await window.glazeAPI.glaze.ipc.invoke("logbook:exportPdf", backendData, projectKey);
  }, [state]);

  // ─── Hulpmiddelen (statische PDF's) ─────────────────────────────────────
  const openHulpmiddel = useCallback(async (bestandsnaam: string) => {
    return await window.glazeAPI.glaze.ipc.invoke<{ success: boolean; error?: string }>(
      "hulpmiddelen:open",
      bestandsnaam,
    );
  }, []);

  const downloadHulpmiddel = useCallback(async (bestandsnaam: string, suggestedName: string) => {
    return await window.glazeAPI.glaze.ipc.invoke<{ success: boolean; canceled: boolean; filePath?: string; error?: string }>(
      "hulpmiddelen:download",
      bestandsnaam,
      suggestedName,
    );
  }, []);

  // ─── Word export ──────────────────────────────────────────────────────────
  const exportWord = useCallback(async (projectKey: string) => {
    const backendData: BackendData = {
      studentName: state.studentName,
      projects: state.projects,
      completedProjects: state.completedProjects,
      skillData: state.skillData,
      entries: state.entries,
      lukEntries: state.lukEntries,
      deadlines: state.deadlines,
      reflections: state.reflections,
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
    curProject,
    curName,
    completeSetup,
    saveSettings,
    createProject,
    updateProjectSettings,
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
    completeProject,
    reopenProject,
    resetProject,
    exportPdf,
    exportWord,
    openHulpmiddel,
    downloadHulpmiddel,
    dataFolder,
    setupStep,
    pickDataFolder,
    confirmDataFolder,
    changeDataFolder,
    celebrateTick,
    triggerCelebration,
  };
}

export type LogbookContext = ReturnType<typeof useLogbook>;

// Helper functions

/** Display name of a project, by its id. Falls back gracefully if the project no longer exists. */
export function projectName(projects: Project[], id: string | null | undefined): string {
  if (!id) return "Onbekend project";
  return projects.find((p) => p.id === id)?.naam || "Onbekend project";
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

/**
 * "X minuten/uur/dagen geleden" for a full ISO timestamp, with an exact
 * (non-rounded) unit boundary: under 60 minutes shows minutes, 60 minutes up
 * to 24 hours shows hours, 24 hours and beyond shows days. Reusable anywhere
 * a moment-in-time needs a relative label (currently: dashboard "Recente
 * activiteiten"). Dutch singular/plural: "1 minuut" / "2 minuten", "1 uur" /
 * "2 uur" (uur is invariant), "1 dag" / "2 dagen".
 */
export function relativeTimeLabel(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) {
    return minutes === 1 ? "1 minuut geleden" : `${minutes} minuten geleden`;
  }
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) {
    return `${hours} uur geleden`;
  }
  const days = Math.floor(diffMs / 86400000);
  return days === 1 ? "1 dag geleden" : `${days} dagen geleden`;
}

/**
 * Latest logged activity date (yyyy-mm-dd) for a project — the newest
 * ontwikkelmoment/bewijsstuk date, or the project's own creation date when
 * nothing has been logged in it yet. Used for the neutral "stilte"-indicator
 * (see stalenessClass) — never for anything performance-related.
 */
export function lastActivityDate(
  data: { entries: Entry[]; lukEntries: LukEntry[]; projects: Project[] },
  projectId: string,
): string {
  const dates = [
    ...data.entries.filter((e) => e.periode === projectId && e.date).map((e) => e.date),
    ...data.lukEntries.filter((e) => e.periode === projectId && e.date).map((e) => e.date as string),
  ];
  if (dates.length === 0) {
    const project = data.projects.find((p) => p.id === projectId);
    return project?.aangemaaktOp || new Date().toISOString().slice(0, 10);
  }
  dates.sort();
  return dates[dates.length - 1];
}

/**
 * Purely visual "how long has it been quiet"-tier for a last-activity date —
 * neutral by default, gradually a bit more noticeable the longer it's been.
 * This is informational only ("het is een tijdje stil"), never a judgement
 * ("je loopt achter") — see the .stale-* classes in styles.css.
 */
export function stalenessClass(dateStr: string): "stale-neutral" | "stale-warm" | "stale-hot" {
  const days = Math.abs(daysUntil(dateStr));
  if (days >= 21) return "stale-hot";
  if (days >= 7) return "stale-warm";
  return "stale-neutral";
}
