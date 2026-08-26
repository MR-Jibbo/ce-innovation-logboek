import { useState, useRef, useEffect } from "react";
import { LogbookCtx, useLogbookCtx } from "../lib/logbook-context";
import { useLogbook, yearOfIndex } from "../lib/use-logbook";
import { tipOfTheDay } from "../lib/constants";
import { SetupView } from "../views/setup-view";
import { DashboardView } from "../views/dashboard-view";
import { ProjectView } from "../views/project-view";
import { OnboardingView } from "../views/onboarding-view";
import { ProjectSettingsView } from "../views/project-settings-view";
import { ProjectsView } from "../views/projects-view";
import { MomentsView } from "../views/moments-view";
import { BewijsstukkenView } from "../views/bewijsstukken-view";
import { SkillsOverviewView } from "../views/skills-overview-view";
import { PlanningView } from "../views/planning-view";
import { ReflectieView } from "../views/reflectie-view";
import { ProfileView } from "../views/profile-view";
import { ModalRenderer } from "../views/modal-renderer";
import { AppIcon, type IconName } from "../components/AppIcon";
import studioBeeftinkLogo from "../assets/studio-beeftink-logo.png";
import type { LogbookContext } from "../lib/use-logbook";
import type { ViewName } from "../lib/types";

const NAV_ITEMS: Array<{ view: ViewName; label: string; icon: IconName }> = [
  { view: "home", label: "Dashboard", icon: "dashboard" },
  { view: "projects", label: "Projecten", icon: "projects" },
  { view: "moments", label: "Ontwikkelmomenten", icon: "moments" },
  { view: "bewijsstukken", label: "Bewijsstukken", icon: "file-text" },
  { view: "skills", label: "Skills", icon: "skills" },
  { view: "planning", label: "Planning", icon: "planning" },
  { view: "reflectie", label: "Reflectie", icon: "reflect" },
];

// Startup splash: a calm fade-in of the logo + tagline, a shared "inzoom"
// transition into the app name growing from small to full size, a 2s hold,
// then the same transition again into the actual app. Runs on a fixed timer
// so the animation always plays out in full; if the real data (normally
// near-instant, since it's a local file) somehow takes longer, the last
// frame just holds until it's ready.
type SplashStage = "brand" | "brand-exit" | "name" | "name-exit";

// Keep these in sync with the animation durations in styles.css
// (splash-fade-in / splash-zoom-out / splash-zoom-in). Total run time is
// ~4.7s: 500 (fade-in) + 1200 (hold brand) + 350 (zoom-out) + 350 (zoom-in) + 2000
// (hold name) + 350 (zoom-out) = 4750ms.
const SPLASH_FADE_IN_MS = 500; // duration of the brand's own fade-in
const SPLASH_HOLD_BRAND_MS = 1200; // extra pause once fully visible, before zooming out — logo + tagline readable
const SPLASH_TRANSITION_MS = 350; // shared zoom-out/zoom-in duration
const SPLASH_HOLD_NAME_MS = 2000; // "Innovation Logboek" stays on screen — readable

interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
}

// Checks GitHub Releases (via the main process, see main:checkForUpdate) for
// a newer published version on mount. Renders nothing until/unless a newer
// version is actually found — fails silently on any error, so a flaky
// connection or GitHub being unreachable never shows a broken banner.
function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateCheckResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.glazeAPI.glaze.ipc
      .invoke<UpdateCheckResult | null>("app:checkForUpdate")
      .then((result) => {
        if (!cancelled && result?.hasUpdate) setUpdate(result);
      })
      .catch(() => {
        // Silent — no update banner is a perfectly fine fallback.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update) return null;

  return (
    <button
      className="sb-update-banner"
      onClick={() => window.glazeAPI.glaze.ipc.invoke("app:openExternal", update.releaseUrl)}
      title="Klik om de nieuwe versie te downloaden"
    >
      <div className="sb-update-banner-title">
        <AppIcon name="download" size="xs" strokeWidth={2} /> Nieuwe versie beschikbaar
      </div>
      <p className="sb-update-banner-text">
        v{update.latestVersion} is nu te downloaden, klik om naar de release-pagina te gaan.
      </p>
    </button>
  );
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<SplashStage>("brand");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    // Only start counting down to the exit once the fade-in has actually
    // finished playing, so the two animations never overlap/cut each other off.
    let t = SPLASH_FADE_IN_MS + SPLASH_HOLD_BRAND_MS;
    at(t, () => setStage("brand-exit"));
    t += SPLASH_TRANSITION_MS;
    at(t, () => setStage("name"));
    t += SPLASH_TRANSITION_MS; // name's own zoom-in animation
    t += SPLASH_HOLD_NAME_MS;
    at(t, () => setStage("name-exit"));
    t += SPLASH_TRANSITION_MS;
    at(t, onDone);

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="splash-screen">
      <div className="drag-region fixed top-0 left-0 right-0 h-13" />
      {(stage === "brand" || stage === "brand-exit") && (
        <div className={`splash-stage splash-brand${stage === "brand-exit" ? " splash-exit" : ""}`}>
          <img
            src={studioBeeftinkLogo}
            alt=""
            style={{ width: "84px", height: "auto", opacity: 0.9 }}
          />
          <p className="splash-tagline">
            Een <span className="accent">Studio Beeftink</span> product
          </p>
        </div>
      )}
      {(stage === "name" || stage === "name-exit") && (
        <div className={`splash-stage splash-name${stage === "name-exit" ? " splash-exit" : ""}`}>
          <p className="splash-appname">
            <span className="accent">Innovation</span> Logboek
          </p>
        </div>
      )}
    </div>
  );
}

export function HomeView() {
  const logbook = useLogbook();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone || !logbook.loaded) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  if (logbook.state.view === "setup") {
    return (
      <LogbookCtx.Provider value={logbook}>
        <SetupView />
      </LogbookCtx.Provider>
    );
  }

  const { state } = logbook;
  const curYearLabel = ` (Jaar ${yearOfIndex(state.projIdx)})`;
  let topbarTitle = "Dashboard";
  if (state.view === "proj-settings") topbarTitle = `Projectinstellingen, ${logbook.cur()}${curYearLabel}`;
  else if (state.view === "project") topbarTitle = `${logbook.cur()}${curYearLabel}`;
  else if (state.view === "projects") topbarTitle = "Projecten";
  else if (state.view === "moments") topbarTitle = "Ontwikkelmomenten";
  else if (state.view === "bewijsstukken") topbarTitle = "Bewijsstukken";
  else if (state.view === "skills") topbarTitle = "Skills";
  else if (state.view === "planning") topbarTitle = "Planning";
  else if (state.view === "reflectie") topbarTitle = "Reflectie";
  else if (state.view === "profile") topbarTitle = "Instellingen";

  const showProjectActions =
    state.view === "project" && state.projOnboarded[logbook.cur()];

  return (
    <LogbookCtx.Provider value={logbook}>
      <div className="app">
        {/* Sidebar */}
        <div className="sidebar">
          <div
            className="sb-brand"
            onClick={() => logbook.navigate("home")}
          >
            <div className="sb-brand-title">Innovation</div>
            <div className="sb-brand-sub">Logboek</div>
          </div>

          <div className="sb-projects">
            {NAV_ITEMS.map((item) => {
              const active =
                state.view === item.view ||
                // Drilling into a specific project still highlights "Projecten".
                ((state.view === "project" || state.view === "proj-settings") && item.view === "projects");
              return (
                <button
                  key={item.view}
                  className={`sb-btn${active ? " active" : ""}`}
                  onClick={() => logbook.navigate(item.view)}
                >
                  <AppIcon name={item.icon} size="sm" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="sb-bottom">
            <UpdateBanner />

            <div className="sb-tip">
              <div className="sb-tip-title">
                <AppIcon name="tip" size="xs" strokeWidth={2} /> Tip van vandaag
              </div>
              <p className="sb-tip-text">{tipOfTheDay()}</p>
            </div>

            <button
              className={`sb-profile-card${state.view === "profile" ? " active" : ""}`}
              onClick={() => logbook.navigate("profile")}
            >
              {state.profilePhoto ? (
                <img
                  src={state.profilePhoto}
                  alt=""
                  className="sb-profile-avatar"
                  style={{ objectPosition: `${state.profilePhotoPosition.x}% ${state.profilePhotoPosition.y}%` }}
                />
              ) : (
                <div className="sb-profile-avatar sb-profile-avatar-fallback">
                  <AppIcon name="user" size="sm" />
                </div>
              )}
              <div className="sb-profile-info">
                <div className="sb-profile-name">{state.studentName || "Naam instellen"}</div>
              </div>
              <AppIcon name="chevron-down" size="xs" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {(state.view === "project" || state.view === "proj-settings") && (
                <button
                  className="btn-icon topbar-back-btn"
                  onClick={() => logbook.navigate("projects")}
                  title="Terug naar Projecten"
                >
                  <AppIcon name="chevron-left" size="sm" strokeWidth={2} />
                </button>
              )}
              {topbarTitle}
              {state.view === "project" && state.completedProjects.includes(logbook.cur()) && (
                <span className="chip chip-green" style={{ fontSize: "var(--fs-xs)" }}>Afgerond</span>
              )}
            </div>
            <div className="topbar-actions">
              {showProjectActions && (
                <>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: "var(--fs-sm)", padding: "6px 12px" }}
                    onClick={() => logbook.navigate("proj-settings")}
                  >
                    <AppIcon name="settings" size="xs" />
                    Projectinstellingen
                  </button>
                  {state.completedProjects.includes(logbook.cur()) ? (
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: "var(--fs-sm)", padding: "6px 12px" }}
                      onClick={() => logbook.reopenProject(logbook.cur())}
                    >
                      Heropenen
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: "var(--fs-sm)", padding: "6px 12px" }}
                      onClick={() => logbook.setModal({ type: "completeProject", key: logbook.cur() })}
                    >
                      <AppIcon name="check" size="xs" strokeWidth={2.5} />
                      Afronden
                    </button>
                  )}
                  <ExportMenu logbook={logbook} />
                </>
              )}
            </div>
          </div>

          {/* Page content */}
          <div className="page">
            <MainContent />
          </div>
        </div>

        {/* Modals */}
        <ModalRenderer />
      </div>
    </LogbookCtx.Provider>
  );
}

function MainContent() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  if (state.view === "home") return <DashboardView />;
  if (state.view === "proj-settings") return <ProjectSettingsView />;
  if (state.view === "project") {
    const key = ctx.cur();
    if (!state.projOnboarded[key]) return <OnboardingView />;
    return <ProjectView />;
  }
  if (state.view === "projects") return <ProjectsView />;
  if (state.view === "moments") return <MomentsView />;
  if (state.view === "bewijsstukken") return <BewijsstukkenView />;
  if (state.view === "skills") return <SkillsOverviewView />;
  if (state.view === "planning") return <PlanningView />;
  if (state.view === "reflectie") return <ReflectieView />;
  if (state.view === "profile") return <ProfileView />;
  return <DashboardView />;
}

function ExportMenu({ logbook }: { logbook: LogbookContext }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const doExport = async (format: "pdf" | "word") => {
    setOpen(false);
    setExporting(true);
    try {
      const projectKey = logbook.cur();
      if (format === "pdf") {
        await logbook.exportPdf(projectKey);
      } else {
        await logbook.exportWord(projectKey);
      }
    } catch (e) {
      console.error(`Export failed:`, e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        className="btn btn-ghost"
        style={{ fontSize: "var(--fs-sm)", padding: "6px 12px" }}
        onClick={() => setOpen(!open)}
        disabled={exporting}
      >
        <AppIcon name="download" size="xs" />
        {exporting ? "Exporteren…" : "Exporteren"}
        <AppIcon name="chevron-down" size="xs" strokeWidth={2.5} />
      </button>
      {open && (
        <div className="export-dropdown">
          <button
            className="export-dropdown-item"
            onClick={() => doExport("pdf")}
          >
            <AppIcon name="file-text" size="sm" />
            <span>Exporteren als PDF</span>
          </button>
          <button
            className="export-dropdown-item"
            onClick={() => doExport("word")}
          >
            <AppIcon name="file-text" size="sm" />
            <span>Exporteren als Word</span>
          </button>
        </div>
      )}
    </div>
  );
}
