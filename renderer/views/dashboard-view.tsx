import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { getGreeting, projectName, daysUntilLabel, relativeTimeLabel, lastActivityDate, stalenessClass } from "../lib/use-logbook";
import { LUK_DEFS } from "../lib/constants";
import { AppIcon } from "../components/AppIcon";
import type { Entry, LukEntry, Deadline } from "../lib/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const RECENT_PAGE_SIZE = 5;

interface RecentActivity {
  id: string;
  title: string;
  periode: string;
  date: string;
  /** Full ISO timestamp used for the relative "X geleden"-label and for
   *  sorting — falls back to `date` at noon for items logged before this
   *  field existed. */
  createdAt: string;
  kind: "moment" | "bewijs";
}

export function DashboardView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  const [recentExpanded, setRecentExpanded] = useState(false);

  // Recente activiteiten: ontwikkelmomenten (skills) én bewijsstukken (LUK),
  // samengevoegd op datum.
  const momentActivities: RecentActivity[] = state.entries
    .filter((e: Entry) => e.date)
    .map((e: Entry) => ({ id: e.id, title: e.title, periode: e.periode, date: e.date, createdAt: e.createdAt || `${e.date}T12:00:00`, kind: "moment" }));
  const bewijsActivities: RecentActivity[] = state.lukEntries
    .filter((e: LukEntry) => e.date)
    .map((e: LukEntry) => {
      const luk = LUK_DEFS.find((l) => l.id === e.lukId);
      const crit = luk?.criteria.find((c) => c.id === e.criterionId);
      return { id: e.id, title: e.title || crit?.title || "Bewijsstuk", periode: e.periode, date: e.date as string, createdAt: e.createdAt || `${e.date}T12:00:00`, kind: "bewijs" };
    });
  const recentEntriesAll = [...momentActivities, ...bewijsActivities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recentEntries = recentExpanded ? recentEntriesAll : recentEntriesAll.slice(0, RECENT_PAGE_SIZE);

  const today = todayISO();
  const upcomingDeadlines = (state.deadlines || [])
    .filter((d: Deadline) => !d.done && d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="animate-fade-in">
      <h1 className="page-title" style={{ marginBottom: "20px" }}>{getGreeting(state.studentName)} 👋</h1>

      {/* Mijn projecten — één lijst met statuslabel per project */}
      <h2 className="section-title">Mijn projecten</h2>
      {state.projects.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "24px", marginBottom: "var(--section-gap)" }}>
          <p style={{ marginBottom: "10px" }}>Nog geen projecten aangemaakt.</p>
          <button className="btn-link" onClick={() => ctx.setModal({ type: "newProject" })}>
            Maak je eerste project aan →
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: "6px", marginBottom: "var(--section-gap)" }}>
          {state.projects.map((p) => {
            const itemCount =
              state.entries.filter((e: Entry) => e.periode === p.id).length +
              state.lukEntries.filter((e: LukEntry) => e.periode === p.id).length;
            const completed = state.completedProjects.includes(p.id);
            const lastActive = lastActivityDate(state, p.id);
            return (
              <button
                key={p.id}
                className="entry-row"
                style={{ width: "100%" }}
                onClick={() => ctx.navigate("project", p.id)}
              >
                <div className="flex-between">
                  <div className="dot-row" style={{ minWidth: 0 }}>
                    <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.naam}
                    </span>
                  </div>
                  <div className="flex-center" style={{ gap: "8px", flexShrink: 0 }}>
                    <span className={`chip ${completed ? "chip-green" : "chip-gray"}`} style={{ fontSize: "var(--fs-xs)" }}>
                      {completed ? "Afgerond" : "Gestart"}
                    </span>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{itemCount} items</span>
                    <AppIcon name="chevron-right" size="xs" />
                  </div>
                </div>
                {!completed && (
                  <p className={stalenessClass(lastActive)} style={{ fontSize: "var(--fs-xs)", margin: "4px 0 0 0" }}>
                    Laatst bijgewerkt: {daysUntilLabel(lastActive)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid-fixed-2" style={{ alignItems: "start" }}>
        {/* Recente activiteiten */}
        <div>
          <h2 className="section-title">Recente activiteiten</h2>
          <div className="card">
            {recentEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 10px" }}>
                <p style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", marginBottom: "4px" }}>
                  Nog geen recente activiteiten
                </p>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                  Zodra je ontwikkelmomenten of bewijsstukken toevoegt, verschijnen ze hier.
                </p>
              </div>
            ) : (
              recentEntries.map((e: RecentActivity) => (
                <button
                  key={`${e.kind}-${e.id}`}
                  className="entry-row"
                  style={{ width: "100%" }}
                  onClick={() => ctx.setModal(e.kind === "moment" ? { type: "entryDetail", entryId: e.id } : { type: "lukDetail", entryId: e.id })}
                >
                  <div className="flex-between" style={{ gap: "10px" }}>
                    <span style={{ fontSize: "var(--fs-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{e.title}</span>
                    <span style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                        {projectName(state.projects, e.periode)}
                      </span>
                      <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--text-faint)" }}>
                        {relativeTimeLabel(e.createdAt)}
                      </span>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
          {recentEntriesAll.length > RECENT_PAGE_SIZE && (
            <button
              className="btn-ghost"
              style={{ width: "100%", justifyContent: "center", marginTop: "8px", fontSize: "var(--fs-sm)" }}
              onClick={() => setRecentExpanded((v) => !v)}
            >
              {recentExpanded ? "Toon minder" : `Toon meer (${recentEntriesAll.length - RECENT_PAGE_SIZE})`}
            </button>
          )}
        </div>

        {/* Aankomende deadlines */}
        <div>
          <h2 className="section-title">Aankomende deadlines</h2>
          <div className="card">
            {upcomingDeadlines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 10px" }}>
                <p style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", marginBottom: "4px" }}>
                  Geen aankomende deadlines
                </p>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                  Je bent helemaal bij!
                </p>
              </div>
            ) : (
              upcomingDeadlines.map((d: Deadline) => (
                <button
                  key={d.id}
                  className="entry-row"
                  style={{ width: "100%" }}
                  onClick={() => ctx.navigate("planning")}
                >
                  <div className="flex-between">
                    <span style={{ fontSize: "var(--fs-sm)" }}>{d.title}</span>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", textAlign: "right" }}>
                      {d.date}{d.projectKey ? ` · ${projectName(state.projects, d.projectKey)}` : ""}
                      <br />
                      <span style={{ color: "var(--pink)", fontWeight: "var(--fw-semibold)" }}>{daysUntilLabel(d.date)}</span>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
