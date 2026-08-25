import { useLogbookCtx } from "../lib/logbook-context";
import { ALL_SKILLS } from "../lib/constants";
import type { Entry } from "../lib/types";

export function SkillsOverviewView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  const withCounts = ALL_SKILLS
    .map((sk) => ({ sk, count: state.entries.filter((e: Entry) => e.skillId === sk.id).length }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="animate-fade-in">
      <div className="grid-3">
        {withCounts.map(({ sk, count }) => (
          <div
            key={sk.id}
            className="card-sm clickable-card"
            onClick={() => ctx.setModal({ type: "skillIndicators", skillId: sk.id })}
          >
            <div className="dot-row" style={{ gap: "7px", marginBottom: "8px" }}>
              <span className="dot" style={{ width: "8px", height: "8px", background: sk.color }} />
              <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)" }}>{sk.name}</span>
            </div>
            <div style={{ fontSize: "var(--fs-xl)", fontWeight: "var(--fw-heavy)", color: sk.color, lineHeight: "1" }}>
              {count}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginTop: "3px", marginBottom: "10px" }}>
              ontwikkelmomenten
            </div>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {sk.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
