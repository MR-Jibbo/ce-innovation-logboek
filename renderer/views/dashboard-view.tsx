import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { getGreeting, pk, yearOfIndex, daysUntilLabel } from "../lib/use-logbook";
import { ALL_SKILLS, PROJ_COLORS } from "../lib/constants";
import { AppIcon } from "../components/AppIcon";
import type { Entry, LukEntry, Deadline } from "../lib/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const RECENT_PAGE_SIZE = 5;

export function DashboardView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const vp = state.visibleProjects || { jaar1: [], jaar2: [] };
  const showJaar1: number[] = vp.jaar1 || [];
  const showJaar2: number[] = vp.jaar2 || [];

  const [recentExpanded, setRecentExpanded] = useState(false);

  const allVisibleIndices = [...showJaar1, ...showJaar2].filter((idx, i, arr) => arr.indexOf(idx) === i);
  const allVisibleKeys = allVisibleIndices.map((i) => pk(state.projNames, i));

  // Mijn projecten: alle geselecteerde/zichtbare projecten uit de instellingen.
  const mijnProjecten = allVisibleIndices.map((idx) => ({ idx, name: pk(state.projNames, idx) }));

  // Gestarte projecten: onboarded, maar nog niet afgerond.
  const gestarteProjecten = mijnProjecten.filter(
    ({ name }) => state.projOnboarded[name] && !state.completedProjects.includes(name),
  );

  // Afgeronde projecten: via de "Afronden"-knop op een project.
  const afgerondeProjecten = state.completedProjects.map((name) => ({
    idx: state.projNames.indexOf(name),
    name,
  }));

  const relEntries = state.entries.filter((e: Entry) => allVisibleKeys.includes(e.periode));
  const sortedSkills = [...ALL_SKILLS]
    .map((sk) => ({ sk, count: relEntries.filter((e: Entry) => e.skillId === sk.id).length }))
    .sort((a, b) => b.count - a.count);

  const recentEntriesAll = [...state.entries]
    .filter((e: Entry) => e.date)
    .sort((a: Entry, b: Entry) => b.date.localeCompare(a.date));
  const recentEntries = recentExpanded ? recentEntriesAll : recentEntriesAll.slice(0, RECENT_PAGE_SIZE);

  const today = todayISO();
  const upcomingDeadlines = (state.deadlines || [])
    .filter((d: Deadline) => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="animate-fade-in">
      <h1 className="page-title" style={{ marginBottom: "20px" }}>{getGreeting(state.studentName)} 👋</h1>

      {mijnProjecten.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          Geen onderdelen geselecteerd. Pas dit aan via je Profiel.
        </div>
      ) : (
        <>
          {/* Mijn projecten · Gestarte projecten · Afgeronde projecten */}
          <div className="grid-fixed-3" style={{ marginBottom: "24px", alignItems: "start" }}>
            <ProjectListColumn
              title="Mijn projecten"
              items={mijnProjecten}
              state={state}
              onClick={(idx) => ctx.navigate("project", idx)}
              emptyText="Nog geen projecten zichtbaar."
              showYear
            />
            <ProjectListColumn
              title="Gestarte projecten"
              items={gestarteProjecten}
              state={state}
              onClick={(idx) => ctx.navigate("project", idx)}
              emptyText="Nog geen projecten gestart."
            />
            <ProjectListColumn
              title="Afgeronde projecten"
              items={afgerondeProjecten}
              state={state}
              onClick={(idx) => idx >= 0 && ctx.navigate("project", idx)}
              emptyText="Nog geen projecten afgerond."
            />
          </div>

          {/* Skills overview */}
          <h2 className="section-title">Ontwikkelmomenten per skill</h2>
          <div className="grid-3" style={{ marginBottom: "24px" }}>
            {sortedSkills.map(({ sk, count }, idx) => (
              <div key={sk.id} className="card-sm animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <div className="dot-row" style={{ gap: "7px", marginBottom: "10px" }}>
                  <span className="dot" style={{ width: "8px", height: "8px", background: sk.color }} />
                  <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)" }}>{sk.name}</span>
                </div>
                <div style={{ fontSize: "var(--fs-xl)", fontWeight: "var(--fw-heavy)", color: sk.color, lineHeight: "1" }}>
                  {count}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginTop: "3px" }}>
                  ontwikkelmomenten
                </div>
              </div>
            ))}
          </div>

          <div className="grid-fixed-2" style={{ alignItems: "start" }}>
            {/* Recente activiteiten */}
            <div>
              <h2 className="section-title">Recente activiteiten</h2>
              <div className="card">
                {recentEntries.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 10px" }}>
                    <div style={{ color: "var(--text-faint)", marginBottom: "8px" }}>
                      <AppIcon name="file-text" size="lg" />
                    </div>
                    <p style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", marginBottom: "4px" }}>
                      Nog geen recente activiteiten
                    </p>
                    <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                      Zodra je ontwikkelmomenten of bewijsstukken toevoegt, verschijnen ze hier.
                    </p>
                  </div>
                ) : (
                  recentEntries.map((e: Entry) => {
                    const skill = ALL_SKILLS.find((s) => s.id === e.skillId);
                    return (
                      <button
                        key={e.id}
                        className="entry-row"
                        style={{ width: "100%" }}
                        onClick={() => ctx.setModal({ type: "entryDetail", entryId: e.id })}
                      >
                        <div className="flex-between">
                          <div className="dot-row" style={{ minWidth: 0 }}>
                            {skill && <span className="dot" style={{ width: "7px", height: "7px", background: skill.color, flexShrink: 0 }} />}
                            <span style={{ fontSize: "var(--fs-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                          </div>
                          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", flexShrink: 0 }}>{e.periode}</span>
                        </div>
                      </button>
                    );
                  })
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
              <div className="flex-between" style={{ marginBottom: "14px" }}>
                <h2 className="section-title" style={{ margin: "0" }}>Aankomende deadlines</h2>
                <button className="btn-link" style={{ fontSize: "var(--fs-sm)" }} onClick={() => ctx.navigate("planning")}>
                  Planning
                </button>
              </div>
              <div className="card">
                {upcomingDeadlines.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 10px" }}>
                    <div style={{ color: "var(--text-faint)", marginBottom: "8px" }}>
                      <AppIcon name="planning" size="lg" />
                    </div>
                    <p style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", marginBottom: "4px" }}>
                      Geen aankomende deadlines
                    </p>
                    <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                      Je bent helemaal bij! 🎉
                    </p>
                  </div>
                ) : (
                  upcomingDeadlines.map((d: Deadline) => (
                    <div key={d.id} className="entry-row" style={{ cursor: "default" }}>
                      <div className="flex-between">
                        <span style={{ fontSize: "var(--fs-sm)" }}>{d.title}</span>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", textAlign: "right" }}>
                          {d.date}{d.projectKey ? ` · ${d.projectKey}` : ""}
                          <br />
                          <span style={{ color: "var(--pink)", fontWeight: "var(--fw-semibold)" }}>{daysUntilLabel(d.date)}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectListColumn({
  title,
  items,
  state,
  onClick,
  emptyText,
  showYear,
}: {
  title: string;
  items: Array<{ idx: number; name: string }>;
  state: { projNames: string[]; lukEntries: LukEntry[] };
  onClick: (idx: number) => void;
  emptyText: string;
  showYear?: boolean;
}) {
  return (
    <div>
      <h2 className="section-title">{title}</h2>
      <div className="card" style={{ padding: "6px" }}>
        {items.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "18px", fontSize: "var(--fs-sm)" }}>
            {emptyText}
          </p>
        ) : (
          items.map(({ idx, name }) => {
            const pl = state.lukEntries.filter((e: LukEntry) => e.periode === name);
            const colorIdx = idx >= 0 ? idx : 0;
            return (
              <button
                key={name}
                className="entry-row"
                style={{ width: "100%", border: "none", boxShadow: "none", background: "none" }}
                onClick={() => onClick(idx)}
              >
                <div className="flex-between">
                  <div className="dot-row" style={{ minWidth: 0 }}>
                    <span className="dot" style={{ width: "8px", height: "8px", background: PROJ_COLORS[colorIdx % PROJ_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}{showYear && idx >= 0 ? ` (Jaar ${yearOfIndex(idx)})` : ""}
                    </span>
                  </div>
                  <div className="flex-center" style={{ gap: "6px", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{pl.length} bewijsstukken</span>
                    <AppIcon name="chevron-right" size="xs" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
