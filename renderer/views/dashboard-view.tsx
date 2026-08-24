import { useLogbookCtx } from "../lib/logbook-context";
import { getGreeting, pk } from "../lib/use-logbook";
import { ALL_SKILLS, PROJ_COLORS } from "../lib/constants";
import type { Entry, LukEntry } from "../lib/types";

export function DashboardView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const j = state.studieJaar || 1;
  const vp = state.visibleProjects || { jaar1: [], jaar2: [] };
  const showJaar1: number[] = vp.jaar1 || [];
  const showJaar2: number[] = vp.jaar2 || [];

  const jaar1Keys = showJaar1.map((i) => pk(state.projNames, i));
  const jaar2Keys = showJaar2.map((i) => pk(state.projNames, i));

  const totalM1 = state.entries.filter((e: Entry) => jaar1Keys.includes(e.periode)).length;
  const totalL1 = state.lukEntries.filter((e: LukEntry) => jaar1Keys.includes(e.periode)).length;
  const totalL2 = state.lukEntries.filter((e: LukEntry) => jaar2Keys.includes(e.periode)).length;

  const relEntries = state.entries.filter((e: Entry) => jaar1Keys.includes(e.periode));
  const sortedSkills = [...ALL_SKILLS]
    .map((sk) => ({ sk, count: relEntries.filter((e: Entry) => e.skillId === sk.id).length }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">{getGreeting(state.studentName)}</h1>
      <p className="page-subtitle">Dashboard — Jaar {j}</p>

      {showJaar1.length > 0 && (
        <>
          <h2 className="section-title">Jaar 1 — Projecten</h2>
          <div className="grid-4" style={{ marginBottom: "18px" }}>
            {[
              { n: showJaar1.filter((i) => state.projOnboarded[pk(state.projNames, i)]).length, l: "Gestart", c: "var(--pink)" },
              { n: totalM1, l: "Ontwikkelmomenten", c: "var(--stat-orange)" },
              { n: totalL1, l: "Bewijsstukken", c: "var(--stat-purple)" },
              { n: showJaar1.length, l: "Projecten", c: "var(--stat-blue)" },
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

          <div className="grid-2" style={{ marginBottom: "32px" }}>
            {showJaar1.map((i) => {
              const nm = pk(state.projNames, i);
              const pe = state.entries.filter((e: Entry) => e.periode === nm);
              const pl = state.lukEntries.filter((e: LukEntry) => e.periode === nm);
              return (
                <div key={i} className="card clickable-card" onClick={() => ctx.navigate("project", i)}>
                  <div className="dot-row" style={{ marginBottom: "8px" }}>
                    <span className="dot" style={{ width: "10px", height: "10px", background: PROJ_COLORS[i % PROJ_COLORS.length] }} />
                    <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-md)" }}>{nm}</span>
                  </div>
                  <div className="flex-center" style={{ gap: "16px", fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
                    <span>{pe.length} ontwikkelmomenten</span>
                    <span>{pl.length} bewijsstukken</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Skills overview */}
          <h2 className="section-title">Ontwikkelmomenten per skill</h2>
          <div className="grid-3" style={{ marginBottom: "32px" }}>
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
        </>
      )}

      {showJaar2.length > 0 && (
        <>
          <h2 className="section-title">Jaar 2 — Projecten</h2>
          <div className="grid-4" style={{ marginBottom: "18px" }}>
            {[
              { n: showJaar2.filter((i) => state.projOnboarded[pk(state.projNames, i)]).length, l: "Gestart", c: "var(--pink)" },
              { n: totalL2, l: "Bewijsstukken", c: "var(--stat-purple)" },
              { n: showJaar2.length, l: "Projecten", c: "var(--stat-blue)" },
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
          <div className="grid-2" style={{ marginBottom: "32px" }}>
            {showJaar2.map((i) => {
              const nm = pk(state.projNames, i);
              const pl = state.lukEntries.filter((e: LukEntry) => e.periode === nm);
              return (
                <div key={i} className="card clickable-card" onClick={() => ctx.navigate("project", i)}>
                  <div className="dot-row" style={{ marginBottom: "8px" }}>
                    <span className="dot" style={{ width: "10px", height: "10px", background: PROJ_COLORS[i % PROJ_COLORS.length] }} />
                    <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-md)" }}>{nm}</span>
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>{pl.length} bewijsstukken</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showJaar1.length === 0 && showJaar2.length === 0 && (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          Geen onderdelen geselecteerd. Pas dit aan via Instellingen.
        </div>
      )}
    </div>
  );
}
