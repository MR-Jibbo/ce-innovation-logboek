import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { getGreeting, pk, keyOfIndex, indexOfKey, yearOfIndex, yearSuffix, daysUntilLabel } from "../lib/use-logbook";
import { ALL_SKILLS, PROJ_COLORS, LUK_DEFS } from "../lib/constants";
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
  kind: "moment" | "bewijs";
}

export function DashboardView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const vp = state.visibleProjects || { jaar1: [], jaar2: [] };
  const showJaar1: number[] = vp.jaar1 || [];
  const showJaar2: number[] = vp.jaar2 || [];

  const [recentExpanded, setRecentExpanded] = useState(false);

  const allVisibleIndices = [...showJaar1, ...showJaar2].filter((idx, i, arr) => arr.indexOf(idx) === i);
  const allVisibleKeys = allVisibleIndices.map((i) => keyOfIndex(i));

  // Mijn projecten: alle geselecteerde/zichtbare projecten uit de instellingen.
  const mijnProjecten = allVisibleIndices.map((idx) => ({ idx, name: pk(state.projNames, idx) }));

  // Gestarte projecten: onboarded, maar nog niet afgerond.
  const gestarteProjecten = mijnProjecten.filter(
    ({ idx }) => state.projOnboarded[keyOfIndex(idx)] && !state.completedProjects.includes(keyOfIndex(idx)),
  );

  // Afgeronde projecten: via de "Afronden"-knop op een project — en alleen
  // als het project nog zichtbaar/geselecteerd staat (anders verdwijnt het
  // hier ook als je het in je Profiel/Instellingen hebt uitgezet).
  const afgerondeProjecten = state.completedProjects
    .map((key) => ({ idx: indexOfKey(key), name: pk(state.projNames, indexOfKey(key)) }))
    .filter(({ idx }) => allVisibleIndices.includes(idx));

  const relEntries = state.entries.filter((e: Entry) => allVisibleKeys.includes(e.periode));
  const sortedSkills = [...ALL_SKILLS]
    .map((sk) => ({ sk, count: relEntries.filter((e: Entry) => e.skillId === sk.id).length }))
    .sort((a, b) => b.count - a.count);

  // Recente activiteiten: ontwikkelmomenten (skills) én bewijsstukken (LUK),
  // samengevoegd op datum — bewijsstukken ontbraken hier eerder omdat ze
  // geen eigen datum hadden.
  const momentActivities: RecentActivity[] = state.entries
    .filter((e: Entry) => e.date)
    .map((e: Entry) => ({ id: e.id, title: e.title, periode: e.periode, date: e.date, kind: "moment" }));
  const bewijsActivities: RecentActivity[] = state.lukEntries
    .filter((e: LukEntry) => e.date)
    .map((e: LukEntry) => {
      const luk = LUK_DEFS.find((l) => l.id === e.lukId);
      const crit = luk?.criteria.find((c) => c.id === e.criterionId);
      return { id: e.id, title: e.title || crit?.title || "Bewijsstuk", periode: e.periode, date: e.date as string, kind: "bewijs" };
    });
  const recentEntriesAll = [...momentActivities, ...bewijsActivities].sort((a, b) => b.date.localeCompare(a.date));
  const recentEntries = recentExpanded ? recentEntriesAll : recentEntriesAll.slice(0, RECENT_PAGE_SIZE);

  const today = todayISO();
  const upcomingDeadlines = (state.deadlines || [])
    .filter((d: Deadline) => !d.done && d.date >= today)
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
              showYear
            />
            <ProjectListColumn
              title="Afgeronde projecten"
              items={afgerondeProjecten}
              state={state}
              onClick={(idx) => idx >= 0 && ctx.navigate("project", idx)}
              emptyText="Nog geen projecten afgerond."
              showYear
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
                      <div className="flex-between">
                        <span style={{ fontSize: "var(--fs-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{e.title}</span>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", flexShrink: 0 }}>
                          {pk(state.projNames, indexOfKey(e.periode))}{yearSuffix(e.periode)}
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
                          {d.date}{d.projectKey ? ` · ${pk(state.projNames, indexOfKey(d.projectKey))}${yearSuffix(d.projectKey)}` : ""}
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
            const pl = state.lukEntries.filter((e: LukEntry) => e.periode === keyOfIndex(idx));
            const colorIdx = idx >= 0 ? idx : 0;
            return (
              <button
                key={idx}
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
