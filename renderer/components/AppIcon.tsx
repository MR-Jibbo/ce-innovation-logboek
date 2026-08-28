import {
  Settings,
  Pencil,
  Trash2,
  Paperclip,
  Image,
  FolderOpen,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  FileText,
  X,
  Plus,
  Download,
  AlertTriangle,
  LayoutDashboard,
  LayoutGrid,
  Activity,
  Layers,
  CalendarDays,
  NotebookPen,
  User,
  Camera,
  Sparkles,
  MoreVertical,
  Search,
  type LucideProps,
} from "lucide-react";

const sizes = { xs: 14, sm: 15, md: 16, lg: 18, xl: 20 } as const;

export type IconName =
  | "settings"
  | "pencil"
  | "trash"
  | "paperclip"
  | "image"
  | "folder"
  | "check"
  | "chevron-right"
  | "chevron-left"
  | "chevron-down"
  | "file-text"
  | "x"
  | "plus"
  | "download"
  | "alert"
  | "dashboard"
  | "projects"
  | "moments"
  | "skills"
  | "planning"
  | "reflect"
  | "user"
  | "camera"
  | "tip"
  | "more"
  | "search";

const components = {
  settings: Settings,
  pencil: Pencil,
  trash: Trash2,
  paperclip: Paperclip,
  image: Image,
  folder: FolderOpen,
  check: Check,
  "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft,
  "chevron-down": ChevronDown,
  "file-text": FileText,
  x: X,
  plus: Plus,
  download: Download,
  alert: AlertTriangle,
  dashboard: LayoutDashboard,
  projects: LayoutGrid,
  moments: Activity,
  skills: Layers,
  planning: CalendarDays,
  reflect: NotebookPen,
  user: User,
  camera: Camera,
  tip: Sparkles,
  more: MoreVertical,
  search: Search,
} as const;

export function AppIcon({
  name,
  size = "sm",
  strokeWidth = 1.75,
  ...rest
}: {
  name: IconName;
  size?: keyof typeof sizes;
  strokeWidth?: number;
} & Omit<LucideProps, "ref">) {
  const Cmp = components[name];
  return <Cmp size={sizes[size]} strokeWidth={strokeWidth} {...rest} />;
}
