import { useState, useRef, useEffect } from "react";
import { LogbookCtx, useLogbookCtx } from "../lib/logbook-context";
import { useLogbook } from "../lib/use-logbook";
import { YEAR_GROUPS, PROJ_COLORS } from "../lib/constants";
import { SetupView } from "../views/setup-view";
import { DashboardView } from "../views/dashboard-view";
import { ProjectView } from "../views/project-view";
import { OnboardingView } from "../views/onboarding-view";
import { SettingsView as AppSettingsView } from "../views/settings-view";
import { ProjectSettingsView } from "../views/project-settings-view";
import { ModalRenderer } from "../views/modal-renderer";
import { AppIcon } from "../components/AppIcon";
import studioBeeftinkLogo from "../assets/studio-beeftink-logo.png";
import type { LogbookContext } from "../lib/use-logbook";

export function HomeView() {
  const logbook = useLogbook();

  if (!logbook.loaded) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ gap: "18px" }}>
        <div className="drag-region fixed top-0 left-0 right-0 h-13" />
        <img
          src={studioBeeftinkLogo}
          alt=""
          style={{ width: "56px", height: "auto", opacity: 0.9 }}
        />
        <p className="text-secondary" style={{ fontSize: "var(--fs-base)" }}>
          Een Studio Beeftink product
        </p>
      </div>
    );
  }

  if (logbook.state.view === "setup") {
    return (
      <LogbookCtx.Provider value={logbook}>
        <SetupView />
      </LogbookCtx.Provider>
    );
  }

  const { state } = logbook;
  let topbarTitle = "Dashboard";
  if (state.view === "settings") topbarTitle = "Instellingen";
  else if (state.view === "proj-settings") topbarTitle = `Projectinstellingen — ${logbook.cur()}`;
  else if (state.view === "project") topbarTitle = logbook.cur();

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
            <div className="sb-brand-title">CE_Innovation</div>
            <div className="sb-brand-sub">Logboek</div>
          </div>

          <div className="sb-projects">
            {YEAR_GROUPS.map((yr) => {
              const open = state.openYears[yr.id];
              return (
                <div key={yr.id}>
                  <button
                    className="sb-year-btn"
                    onClick={() => logbook.toggleYear(yr.id)}
                  >
                    <span>{yr.label}</span>
                    <span className={`sb-year-chevron${open ? " open" : ""}`}>
                      <AppIcon name="chevron-right" size="xs" strokeWidth={2.5} />
                    </span>
                  </button>
                  {open &&
                    yr.indices.map((idx) => {
                      const label = state.projNames[idx] || `Project ${idx + 1}`;
                      const active =
                        (state.view === "project" || state.view === "proj-settings") &&
                        state.projIdx === idx;
                      const color = PROJ_COLORS[idx % PROJ_COLORS.length];
                      return (
                        <button
                          key={idx}
                          className={`sb-btn${active ? " active" : ""}`}
                          onClick={() => logbook.navigate("project", idx)}
                        >
                          <span className="sb-dot" style={{ background: color }} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>

          <div className="sb-bottom">
            <button
              className={`sb-settings${state.view === "settings" ? " active" : ""}`}
              onClick={() => logbook.navigate("settings")}
            >
              <AppIcon name="settings" size="sm" />
              <span>Instellingen</span>
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-title">{topbarTitle}</div>
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
  if (state.view === "settings") return <AppSettingsView />;
  if (state.view === "proj-settings") return <ProjectSettingsView />;
  if (state.view === "project") {
    const key = ctx.cur();
    if (!state.projOnboarded[key]) return <OnboardingView />;
    return <ProjectView />;
  }
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
