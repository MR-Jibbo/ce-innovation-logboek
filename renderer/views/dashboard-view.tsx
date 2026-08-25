import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { getGreeting, pk } from "../lib/use-logbook";
import { ALL_SKILLS, PROJ_COLORS } from "../lib/constants";
import { AppIcon } from "../components/AppIcon";
import type { Entry, LukEntry, Deadline } from "../lib/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const vp = state.visibleProjects || { jaar1: [], jaar2: [] };
  const showJaar1: number[] = vp.jaar1 || [];
  const showJaar2: number[] = vp.jaar2 || [];
  const bothYears = showJaar1.length > 0 && showJaar2.length > 0;

  const [statsYear, setStatsYear] = useState<1 | 2>((state.studieJaar as 1 | 2) || 1);
  const activeIndices = statsYear === 1 ? showJaar1 : showJaar2;
  const activeKeys = activeIndices.map((i) => pk(state.projNames, i));

  const jaar1Keys = showJaar1.map((i) => pk(state.projNames, i));
  const jaar2Keys = showJaar2.map((i) => pk(state.projNames, i));
  const allVisibleIndices = [...showJaar1, ...showJaar2];
  const allVisibleKeys = [...jaar1Keys, ...jaar2Keys];

  const thisMonthPrefix = todayISO().slice(0, 7); // "YYYY-MM"

  const gestart = activeIndices.filter((i) => state.projOnboarded[pk(state.projNames, i)]).length;
  const momentenDezeMaand = state.entries.filter(
    (e: Entry) => activeKeys.includes(e.periode) && e.date?.startsWith(thisMonthPrefix),
  ).length;
  const bewijsstukkenTotaal = state.lukEntries.filter((e: LukEntry) => activeKeys.includes(e.periode)).length;

  // "Huidige projecten": the most recently touched projects (by latest
  // ontwikkelmoment date), falling back to onboarded projects if nothing
  // has a date yet.
  const lastActivity: Record<string, string> = {};
  for (const e of state.entries as Entry[]) {
    if (e.date && (!lastActivity[e.periode] || e.date > lastActivity[e.periode])) {
      lastActivity[e.periode] = e.date;
    }
  }
  const huidigeProjecten = allVisibleIndices
    .map((i) => pk(state.projNames, i))
    .filter((key, idx, arr) => arr.indexOf(key) === idx) // de-dupe (jaar1/jaar2 keys can't overlap in practice, but be safe)
    .sort((a, b) => (lastActivity[b] || "").localeCompare(lastActivity[a] || ""))
    .slice(0, 2);

  const relEntries = state.entries.filter((e: Entry) => allVisibleKeys.includes(e.periode));
  const sortedSkills = [...ALL_SKILLS]
    .map((sk) => ({ sk, count: relEntries.filter((e: Entry) => e.skillId === sk.id).length }))
    .sort((a, b) => b.count - a.count);

  const recentEntries = [...state.entries]
    .filter((e: Entry) => e.date)
    .sort((a: Entry, b: Entry) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const today = todayISO();
  const upcomingDeadlines = (state.deadlines || [])
    .filter((d: Deadline) => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: "4px" }}>
        <h1 className="page-title" style={{ marginBottom: "0" }}>{getGreeting(state.studentName)} 👋</h1>
        {bothYears && (
          <select
            className="input"
            style={{ width: "auto" }}
            value={statsYear}
            onChange={(e) => setStatsYear(Number(e.target.value) as 1 | 2)}
          >
            <option value={1}>Jaar 1</option>
            <option value={2}>Jaar 2</option>
          </select>
        )}
      </div>
      <p className="page-subtitle">Dashboard — Jaar {statsYear}</p>

      {activeIndices.length === 0 && !bothYears ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          Geen onderdelen geselecteerd. Pas dit aan via Instellingen.
        </div>
      ) : (
        <>
          <h2 className="section-title">Overzicht Jaar {statsYear}</h2>
          <div className="grid-4" style={{ marginBottom: "24px" }}>
            {[
              { n: gestart, l: "Gestart projecten", c: "var(--pink)" },
              { n: momentenDezeMaand, l: "Ontwikkelmomenten deze maand", c: "var(--stat-orange)" },
              { n: bewijsstukkenTotaal, l: "Bewijsstukken toegevoegd", c: "var(--stat-purple)" },
              { n: activeIndices.length, l: "Projecten totaal", c: "var(--stat-blue)" },
            ].map(({ n, l, c }, idx) => (
              <div key={idx} className="stat-tile" style={{ animationDelay: `${idx * 40}ms` }}>
                <div className="animate-count" style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-heavy)", color: c, lineHeight: "1" }}>
                  {n}
                </div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginTop: "5px" }}>
                  {l}
                </div>
              </div>
            ))}
          </div>

          <div className="grid-fixed-2" style={{ marginBottom: "24px", alignItems: "start" }}>
            {/* Huidige projecten */}
            <div>
              <h2 className="section-title">Huidige projecten</h2>
              {huidigeProjecten.length === 0 ? (
                <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "24px" }}>
                  Nog geen projecten gestart.
                </div>
              ) : (
                huidigeProjecten.map((nm) => {
                  const idx = state.projNames.indexOf(nm);
                  const pe = state.entries.filter((e: Entry) => e.periode === nm);
                  const pl = state.lukEntries.filter((e: LukEntry) => e.periode === nm);
                  const yearLabel = jaar1Keys.includes(nm) ? "Jaar 1" : "Jaar 2";
                  return (
                    <div key={nm} className="card clickable-card" style={{ marginBottom: "10px" }} onClick={() => ctx.navigate("project", idx)}>
                      <div className="flex-between" style={{ marginBottom: "6px" }}>
                        <div className="dot-row">
                          <span className="dot" style={{ width: "10px", height: "10px", background: PROJ_COLORS[idx % PROJ_COLORS.length] }} />
                          <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-md)" }}>{nm}</span>
                        </div>
                        <span className="chip chip-gray" style={{ fontSize: "var(--fs-xs)" }}>{yearLabel}</span>
                      </div>
                      <div className="flex-center" style={{ gap: "16px", fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
                        <span>{pe.length} ontwikkelmomenten</span>
                        <span>{pl.length} bewijsstukken</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mijn projecten */}
            <div>
              <div className="flex-between" style={{ marginBottom: "14px" }}>
                <h2 className="section-title" style={{ margin: "0" }}>Mijn projecten</h2>
                <button className="btn-link" style={{ fontSize: "var(--fs-sm)" }} onClick={() => ctx.navigate("projects")}>
                  Bekijk alles
                </button>
              </div>
              <div className="card" style={{ padding: "6px" }}>
                {allVisibleIndices.length === 0 ? (
                  <p style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "18px", fontSize: "var(--fs-sm)" }}>
                    Nog geen projecten zichtbaar.
                  </p>
                ) : (
                  allVisibleIndices.map((idx) => {
                    const nm = pk(state.projNames, idx);
                    const pl = state.lukEntries.filter((e: LukEntry) => e.periode === nm);
                    return (
                      <button
                        key={idx}
                        className="entry-row"
                        style={{ width: "100%", border: "none", boxShadow: "none", background: "none" }}
                        onClick={() => ctx.navigate("project", idx)}
                      >
                        <div className="flex-between">
                          <div className="dot-row">
                            <span className="dot" style={{ width: "8px", height: "8px", background: PROJ_COLORS[idx % PROJ_COLORS.length] }} />
                            <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)" }}>{nm}</span>
                          </div>
                          <div className="flex-center" style={{ gap: "6px" }}>
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
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                          {d.date}{d.projectKey ? ` · ${d.projectKey}` : ""}
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
