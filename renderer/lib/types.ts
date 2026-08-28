// ─── Core Types ─────────────────────────────────────────────────────────────

export type ViewName =
  | "setup"
  | "home"
  | "project"
  | "proj-settings"
  | "projects"
  | "moments"
  | "bewijsstukken"
  | "skills"
  | "planning"
  | "reflectie"
  | "profile";

export type SetupStep = "location" | "profile";

export type StatusKey = "not_started" | "in_progress";

export interface StatusDef {
  key: StatusKey;
  label: string;
  cls: string;
}

export interface Criterion {
  id: string;
  title: string;
  desc: string;
}

export interface LukDef {
  id: string;
  name: string;
  dp: string;
  desc: string;
  criteria: Criterion[];
}

export interface SkillDef {
  id: string;
  name: string;
  color: string;
  desc: string;
  ind: string[];
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
}

/**
 * A student-created project. There is no more fixed "Jaar 1"/"Jaar 2"
 * structure — a student creates as many projects as they want, each with
 * its own required LUK-koppeling and optional skills.
 */
export interface Project {
  id: string;
  naam: string;
  /** Leeruitkomst ids (LUK_DEFS) linked to this project — required, min. 1. */
  lukIds: string[];
  /** Skill ids (ALL_SKILLS) linked to this project — optional, may be empty. */
  skillIds: string[];
  /** ISO yyyy-mm-dd, stamped on creation. */
  aangemaaktOp: string;
}

export interface Entry {
  id: string;
  skillId: string;
  title: string;
  /** The owning project's id (Project.id) — NOT the display name. */
  periode: string;
  date: string;
  description: string;
  reflection: string;
  actionItems: ActionItem[];
  status: StatusKey;
}

export interface LukFile {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  date: string;
}

export interface LukEntry {
  id: string;
  lukId: string;
  criterionId: string;
  /** The owning project's id (Project.id) — see the note on Entry.periode. */
  periode: string;
  title?: string;
  text: string;
  files: LukFile[];
  /** ISO yyyy-mm-dd, stamped automatically on creation (see addLukEntry) —
   *  used to place bewijsstukken in the dashboard's "Recente activiteiten". */
  date?: string;
}

export interface SkillDataItem {
  plan?: string;
  tips?: string[];
}

export interface Deadline {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  /** The linked project's id (Project.id), if any. */
  projectKey?: string;
  done?: boolean;
}

export interface Reflection {
  id: string;
  date: string; // ISO yyyy-mm-dd
  text: string;
}

export interface AppState {
  view: ViewName;
  /** The currently open project's id, or null when no project is open. */
  projectId: string | null;
  studentName: string;
  projects: Project[];
  completedProjects: string[];
  skillData: Record<string, Record<string, SkillDataItem>>;
  entries: Entry[];
  lukEntries: LukEntry[];
  deadlines: Deadline[];
  reflections: Reflection[];
}

export type ModalState =
  | { type: "skillDetail"; skillId: string }
  | { type: "skillIndicators"; skillId: string }
  | { type: "entryDetail"; entryId: string }
  | { type: "entryForm"; skillId?: string; periode?: string; editId?: string }
  | { type: "lukCritDetail"; lukId: string; criterionId: string; periode: string }
  | { type: "lukDetail"; entryId: string }
  | { type: "lukEntryForm"; lukId: string; criterionId: string; periode: string; editId?: string }
  | { type: "newProject" }
  | { type: "completeProject"; key: string }
  | { type: "confirm"; msg: string; onOk: () => void }
  | null;
