import { useState, useRef, useEffect, useMemo } from "react";
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
import easterEggFish from "../assets/easter-egg-fish.png";
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

  // Easter egg: 5 clicks on the sidebar brand within 5 seconds triggers a
  // trampolining-fish effect that ends with the fish diving off the bottom
  // of the window. Declared above the early returns below (setup/splash) so
  // the hooks always run in the same order regardless of which screen is
  // showing.
  const [eggFish, setEggFish] = useState<FishSpec[] | null>(null);
  const brandClickTimes = useRef<number[]>([]);
  const eggTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleBrandClick = () => {
    const now = Date.now();
    brandClickTimes.current = [...brandClickTimes.current.filter((t) => now - t < 5000), now];
    if (brandClickTimes.current.length >= 5) {
      brandClickTimes.current = [];
      if (eggTimer.current) clearTimeout(eggTimer.current);
      const fish = generateFishSpecs(EASTER_EGG_FISH_COUNT);
      setEggFish(fish);
      const runtimeMs = Math.max(...fish.map((f) => f.delayS + f.activeS)) * 1000 + 150;
      eggTimer.current = setTimeout(() => setEggFish(null), runtimeMs);
    }
  };

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
  if (state.view === "proj-settings") topbarTitle = `Projectinstellingen, ${logbook.curName()}${curYearLabel}`;
  else if (state.view === "project") topbarTitle = `${logbook.curName()}${curYearLabel}`;
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
        {eggFish && <FishTrampoline fish={eggFish} />}
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sb-brand" onClick={handleBrandClick}>
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

const EASTER_EGG_FISH_COUNT = 12;

interface FishSpec {
  id: number;
  left: number; // starting horizontal position, vw %
  size: number; // px, wrapper width (image scales to fit)
  flip: boolean; // mirror the image itself (independent of the animated transform)
  delayS: number;
  hopDurationsS: number[]; // one per bounce
  hopHeightsVh: number[]; // apex height of each bounce, one per hop
  driftsPx: number[]; // cumulative horizontal drift at the end of each hop
  groundRotations: number[]; // rotation at each landing, length hops + 1 (incl. start)
  apexRotations: number[]; // rotation at each apex, one per hop
  diveDriftPx: number;
  diveDurationS: number;
  diveRotationDeg: number;
  activeS: number; // total time the animation itself runs, excluding delayS
}

/**
 * Builds one randomized bounce-then-dive path per fish: a handful of
 * trampoline hops (each losing a bit of height, like a real bouncing ball
 * running out of energy) followed by a final dive down and off the bottom
 * of the window instead of just vanishing.
 */
function generateFishSpecs(count: number): FishSpec[] {
  return Array.from({ length: count }, (_, id) => {
    const hops = 3 + Math.round(Math.random()); // 3 or 4 bounces
    const delayS = Math.random() * 0.6;
    const baseHeightVh = 42 + Math.random() * 30;
    const hopDurationsS: number[] = [];
    const hopHeightsVh: number[] = [];
    const driftsPx: number[] = [];
    const apexRotations: number[] = [];
    const groundRotations: number[] = [-10 + Math.random() * 8];
    let drift = 0;
    for (let i = 0; i < hops; i++) {
      hopDurationsS.push(0.6 + Math.random() * 0.3);
      hopHeightsVh.push(baseHeightVh * (1 - i * 0.1) * (0.9 + Math.random() * 0.2));
      drift += (Math.random() - 0.5) * 22;
      driftsPx.push(drift);
      apexRotations.push(6 + Math.random() * 16);
      groundRotations.push(-12 + Math.random() * 14);
    }
    const diveDurationS = 0.55 + Math.random() * 0.3;
    const diveSign = Math.random() < 0.5 ? -1 : 1;
    return {
      id,
      left: Math.random() * 92,
      size: 40 + Math.random() * 36,
      flip: Math.random() < 0.5,
      delayS,
      hopDurationsS,
      hopHeightsVh,
      driftsPx,
      groundRotations,
      apexRotations,
      diveDriftPx: drift + diveSign * (10 + Math.random() * 16),
      diveDurationS,
      diveRotationDeg: groundRotations[groundRotations.length - 1] + diveSign * (25 + Math.random() * 25),
      activeS: hopDurationsS.reduce((a, b) => a + b, 0) + diveDurationS,
    };
  });
}

/** Renders one fish's @keyframes rule: bounce hops (ease-out up, ease-in down, with a
 *  squash-on-landing/stretch-at-apex wobble) then a final dive off the bottom. */
function buildFishKeyframes(name: string, f: FishSpec): string {
  type Stop = { pct: number; transform: string; easing?: string };
  const stops: Stop[] = [
    { pct: 0, transform: `translate(0px, 0) rotate(${f.groundRotations[0]}deg) scale(1.14, 0.84)`, easing: "ease-out" },
  ];
  let t = 0;
  f.hopDurationsS.forEach((dur, i) => {
    const apexT = t + dur * 0.5;
    const groundT = t + dur;
    stops.push({
      pct: (apexT / f.activeS) * 100,
      transform: `translate(${f.driftsPx[i]}px, -${f.hopHeightsVh[i]}vh) rotate(${f.apexRotations[i]}deg) scale(0.9, 1.12)`,
      easing: "ease-in",
    });
    stops.push({
      pct: (groundT / f.activeS) * 100,
      transform: `translate(${f.driftsPx[i]}px, 0) rotate(${f.groundRotations[i + 1]}deg) scale(1.14, 0.84)`,
      easing: "ease-out",
    });
    t = groundT;
  });
  stops.push({
    pct: 100,
    transform: `translate(${f.diveDriftPx}px, 75vh) rotate(${f.diveRotationDeg}deg) scale(0.85, 1.22)`,
  });
  const body = stops
    .map((s) => `${s.pct.toFixed(2)}% { transform: ${s.transform};${s.easing ? ` animation-timing-function: ${s.easing};` : ""} }`)
    .join(" ");
  return `@keyframes ${name} { ${body} }`;
}

/** Easter egg: a handful of fish trampolining up from the bottom of the app, each
 *  eventually diving down and off the bottom of the window instead of just vanishing. */
function FishTrampoline({ fish }: { fish: FishSpec[] }) {
  const css = useMemo(() => fish.map((f) => buildFishKeyframes(`fish-dive-${f.id}`, f)).join("\n"), [fish]);

  return (
    <div className="easter-egg-fish-layer">
      <style>{css}</style>
      {fish.map((f) => (
        <div
          key={f.id}
          className="easter-egg-fish-wrap"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            animationName: `fish-dive-${f.id}`,
            animationDuration: `${f.activeS}s`,
            animationDelay: `${f.delayS}s`,
          }}
        >
          <img
            src={easterEggFish}
            alt=""
            className="easter-egg-fish"
            style={{ transform: f.flip ? "scaleX(-1)" : undefined }}
          />
        </div>
      ))}
    </div>
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
