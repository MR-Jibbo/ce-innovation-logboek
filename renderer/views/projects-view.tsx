import { useLogbookCtx } from "../lib/logbook-context";
import { AppIcon } from "../components/AppIcon";
import type { Entry, LukEntry } from "../lib/types";

export function ProjectsView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  return (
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: "18px" }}>
        <h2 className="section-title" style={{ margin: 0 }}>Projecten</h2>
        <button className="btn btn-primary" onClick={() => ctx.setModal({ type: "newProject" })}>
          <AppIcon name="plus" size="xs" strokeWidth={2.5} /> Nieuw project
        </button>
      </div>

      {state.projects.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          <p style={{ marginBottom: "10px" }}>Nog geen projecten aangemaakt.</p>
          <button className="btn-link" onClick={() => ctx.setModal({ type: "newProject" })}>
            Maak je eerste project aan →
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {state.projects.map((p) => {
            const pe = state.entries.filter((e: Entry) => e.periode === p.id);
            const pl = state.lukEntries.filter((e: LukEntry) => e.periode === p.id);
            const completed = state.completedProjects.includes(p.id);
            const itemCount = pe.length + pl.length;
            return (
              <div
                key={p.id}
                className="card clickable-card"
                onClick={() => ctx.navigate("project", p.id)}
              >
                <div className="flex-between" style={{ marginBottom: "8px" }}>
                  <div className="dot-row">
                    <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-md)" }}>{p.naam}</span>
                  </div>
                  {completed && <span className="chip chip-green" style={{ fontSize: "var(--fs-xs)" }}>Afgerond</span>}
                </div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
