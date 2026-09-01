import { useLogbookCtx } from "../lib/logbook-context";
import { HULPMIDDELEN } from "../data/hulpmiddelen";

export function HulpmiddelenView() {
  const ctx = useLogbookCtx();

  return (
    <div className="animate-fade-in">
      <div className="grid-fixed-3">
        {HULPMIDDELEN.map((h) => (
          <div
            key={h.id}
            className="hulpmiddel-tile clickable-card"
            onClick={() => ctx.setModal({ type: "hulpmiddelDetail", hulpmiddelId: h.id })}
          >
            <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-md)" }}>{h.titel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
