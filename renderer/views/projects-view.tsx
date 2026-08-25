import { useLogbookCtx } from "../lib/logbook-context";
import { pk } from "../lib/use-logbook";
import { YEAR_GROUPS, PROJ_COLORS } from "../lib/constants";
import type { Entry, LukEntry } from "../lib/types";

export function ProjectsView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const vp = state.visibleProjects || { jaar1: [], jaar2: [] };

  return (
    <div className="animate-fade-in">
      {YEAR_GROUPS.map((yr) => {
        const indices = (vp[yr.id] || []) as number[];
        if (indices.length === 0) return null;
        return (
          <div key={yr.id} style={{ marginBottom: "28px" }}>
            <h2 className="section-title">{yr.label}</h2>
            <div className="grid-2">
              {indices.map((idx) => {
                const nm = pk(state.projNames, idx);
                const pe = state.entries.filter((e: Entry) => e.periode === nm);
                const pl = state.lukEntries.filter((e: LukEntry) => e.periode === nm);
                const onboarded = state.projOnboarded[nm];
                return (
                  <div
                    key={idx}
                    className="card clickable-card"
                    onClick={() => ctx.navigate("project", idx)}
                  >
                    <div className="flex-between" style={{ marginBottom: "8px" }}>
                      <div className="dot-row">
                        <span className="dot" style={{ width: "10px", height: "10px", background: PROJ_COLORS[idx % PROJ_COLORS.length] }} />
                        <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-md)" }}>{nm}</span>
                      </div>
                      {!onboarded && (
                        <span className="chip chip-gray" style={{ fontSize: "var(--fs-xs)" }}>Nog niet gestart</span>
                      )}
                    </div>
                    <div className="flex-center" style={{ gap: "16px", fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
                      <span>{pe.length} ontwikkelmomenten</span>
                      <span>{pl.length} bewijsstukken</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {(vp.jaar1?.length || 0) === 0 && (vp.jaar2?.length || 0) === 0 && (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          Geen projecten geselecteerd. Pas dit aan via je Profiel.
        </div>
      )}
    </div>
  );
}
