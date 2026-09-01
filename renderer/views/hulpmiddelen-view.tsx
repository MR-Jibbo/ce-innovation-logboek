import { useLogbookCtx } from "../lib/logbook-context";
import { HULPMIDDELEN } from "../data/hulpmiddelen";

export function HulpmiddelenView() {
  const ctx = useLogbookCtx();

  return (
    <div className="animate-fade-in">
      <div className="grid-3">
        {HULPMIDDELEN.map((h) => (
          <div
            key={h.id}
            className="card-sm clickable-card"
            onClick={() => ctx.setModal({ type: "hulpmiddelDetail", hulpmiddelId: h.id })}
          >
            <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)" }}>{h.titel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
