import { useLogbookCtx } from "../lib/logbook-context";
import { LUK_DEFS } from "../lib/constants";
import { yearSuffix } from "../lib/use-logbook";
import { AppIcon } from "../components/AppIcon";
import type { LukEntry } from "../lib/types";

export function BewijsstukkenView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  // No explicit date on a LukEntry — id is chronological-ish (uid includes
  // a random suffix, not sortable), so just keep insertion order reversed.
  const sorted = [...state.lukEntries].reverse();
  const yearOf = (name: string) => yearSuffix(state.projNames, name);

  return (
    <div className="animate-fade-in">
      {sorted.length === 0 ? (
        <div className="card" style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "36px" }}>
          Nog geen bewijsstukken toegevoegd. Voeg er een toe vanuit een project.
        </div>
      ) : (
        sorted.map((e: LukEntry) => {
          const luk = LUK_DEFS.find((l) => l.id === e.lukId);
          const crit = luk?.criteria.find((c) => c.id === e.criterionId);
          return (
            <button
              key={e.id}
              className="entry-row"
              style={{ marginBottom: "8px", width: "100%" }}
              onClick={() => ctx.setModal({ type: "lukDetail", entryId: e.id })}
            >
              <div className="flex-between" style={{ gap: "10px" }}>
                <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-base)" }}>
                  {e.title || crit?.title || "Bewijsstuk"}
                </span>
                {e.files?.length > 0 && (
                  <span className="chip chip-gray" style={{ fontSize: "var(--fs-xs)", flexShrink: 0 }}>
                    {e.files.length} bestand{e.files.length !== 1 ? "en" : ""}
                  </span>
                )}
              </div>
              {e.text && (
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", margin: "5px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.text}
                </p>
              )}
              <div className="flex-center" style={{ gap: "10px", marginTop: "5px", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                {luk && <span>{luk.name}</span>}
                <span className="dot-row" style={{ gap: "4px" }}>
                  <AppIcon name="projects" size="xs" /> {e.periode}{yearOf(e.periode)}
                </span>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
