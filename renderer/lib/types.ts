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

export interface Entry {
  id: string;
  skillId: string;
  title: string;
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
  periode: string;
  text: string;
  files: LukFile[];
}

export interface SkillDataItem {
  plan?: string;
  tips?: string[];
}

export interface VisibleProjects {
  jaar1: number[];
  jaar2: number[];
}

export interface OpenYears {
  jaar1: boolean;
  jaar2: boolean;
}

export interface Deadline {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  projectKey?: string;
  done?: boolean;
}

export interface Reflection {
  id: string;
  date: string; // ISO yyyy-mm-dd
  text: string;
}

export interface ProfilePhotoPosition {
  x: number; // 0-100, used as object-position X
  y: number; // 0-100, used as object-position Y
}

export interface AppState {
  view: ViewName;
  projIdx: number;
  studentName: string;
  studieJaar: number;
  visibleProjects: VisibleProjects | null;
  projNames: string[];
  projOnboarded: Record<string, boolean>;
  completedProjects: string[];
  selectedSkillIds: Record<string, string[]>;
  lukSelections: Record<string, string[]>;
  skillData: Record<string, Record<string, SkillDataItem>>;
  entries: Entry[];
  lukEntries: LukEntry[];
  openYears: OpenYears;
  deadlines: Deadline[];
  reflections: Reflection[];
  profilePhoto: string | null;
  profilePhotoPosition: ProfilePhotoPosition;
}

export type ModalState =
  | { type: "skillDetail"; skillId: string }
  | { type: "skillIndicators"; skillId: string }
  | { type: "entryDetail"; entryId: string }
  | { type: "entryForm"; skillId?: string; periode?: string; editId?: string }
  | { type: "lukCritDetail"; lukId: string; criterionId: string; periode: string }
  | { type: "lukDetail"; entryId: string }
  | { type: "lukEntryForm"; lukId: string; criterionId: string; periode: string; editId?: string }
  | { type: "completeProject"; key: string }
  | { type: "photoEditor" }
  | { type: "confirm"; msg: string; onOk: () => void }
  | null;
