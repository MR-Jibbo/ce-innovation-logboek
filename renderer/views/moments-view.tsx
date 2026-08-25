import { useLogbookCtx } from "../lib/logbook-context";
import { ALL_SKILLS, STATUS } from "../lib/constants";
import { yearSuffix } from "../lib/use-logbook";
import { AppIcon } from "../components/AppIcon";
import type { Entry } from "../lib/types";

export function MomentsView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  const sorted = [...state.entries].sort((a: Entry, b: Entry) => (b.date || "").localeCompare(a.date || ""));
  const yearOf = (name: string) => yearSuffix(state.projNames, name);

  return (
    <div className="animate-fade-in">
      {sorted.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          Nog geen ontwikkelmomenten gedocumenteerd. Voeg er een toe vanuit een project.
        </div>
      ) : (
        sorted.map((e: Entry) => {
          const skill = ALL_SKILLS.find((s) => s.id === e.skillId);
          const st = STATUS.find((s) => s.key === e.status) || STATUS[0];
          return (
            <button
              key={e.id}
              className="entry-row"
              style={{ marginBottom: "8px", width: "100%" }}
              onClick={() => ctx.setModal({ type: "entryDetail", entryId: e.id })}
            >
              <div className="flex-between" style={{ gap: "10px" }}>
                <div className="dot-row" style={{ gap: "8px", minWidth: 0 }}>
                  {skill && <span className="dot" style={{ width: "8px", height: "8px", background: skill.color, flexShrink: 0 }} />}
                  <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-base)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.title}
                  </span>
                </div>
                <span className={`chip ${st.cls}`} style={{ fontSize: "var(--fs-xs)", flexShrink: 0 }}>{st.label}</span>
              </div>
              <div className="flex-center" style={{ gap: "10px", marginTop: "5px", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                {skill && <span>{skill.name}</span>}
                <span className="dot-row" style={{ gap: "4px" }}>
                  <AppIcon name="projects" size="xs" /> {e.periode}{yearOf(e.periode)}
                </span>
                {e.date && <span>{e.date}</span>}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
