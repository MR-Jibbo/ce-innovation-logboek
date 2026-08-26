import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { pk } from "../lib/use-logbook";
import { ALL_SKILLS, LUK_DEFS } from "../lib/constants";
import { AppIcon } from "../components/AppIcon";

export function OnboardingView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const key = ctx.cur();
  const hasSkills = state.projIdx < 5;
  const [step, setStep] = useState(hasSkills ? 1 : 2);
  const [ts, setTs] = useState<string[]>([...(state.selectedSkillIds[key] || [])]);
  const [tl, setTl] = useState<string[]>((() => {
    const existing = [...(state.lukSelections[key] || [])];
    if (existing.length) return existing;
    const def = LUK_DEFS.find((l) => l.dp === ["Project 1", "Project 2", "Project 3", "Project 4", "Vrije Ruimte"][state.projIdx % 5]);
    return def ? [def.id] : [];
  })());

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">{pk(state.projNames, state.projIdx)}</h1>

      {hasSkills && (
        <div className="flex-center" style={{ gap: "10px", marginBottom: "24px" }}>
          {[1, 2].map((s) => {
            const dotClass = step === s ? "current" : step > s ? "done" : "pending";
            return (
              <div key={s} className="flex-center" style={{ gap: "10px" }}>
                <div key={s} className="flex-center" style={{ gap: "7px" }}>
                  <div className={`step-dot ${dotClass}`}>
                    {step > s ? <AppIcon name="check" size="xs" strokeWidth={3} /> : String(s)}
                  </div>
                  <span style={{ fontSize: "var(--fs-sm)", fontWeight: step === s ? "var(--fw-semibold)" : "var(--fw-regular)", color: step === s ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                    {s === 1 ? "Skills kiezen" : "LUKs kiezen"}
                  </span>
                </div>
                {s < 2 && <div style={{ height: "1px", width: "28px", background: "var(--border)" }} />}
              </div>
            );
          })}
        </div>
      )}

      {step === 1 && hasSkills && (
        <>
          <p style={{ fontSize: "var(--fs-base)", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Welke skills wil je dit project ontwikkelen?
          </p>
          <div className="grid-3" style={{ marginBottom: "24px" }}>
            {ALL_SKILLS.map((sk) => {
              const sel = ts.includes(sk.id);
              return (
                <div
                  key={sk.id}
                  className={`onboard-card${sel ? " sel" : ""}`}
                  onClick={() => setTs(sel ? ts.filter((x) => x !== sk.id) : [...ts, sk.id])}
                >
                  <div className="flex-between">
                    <div className="dot-row" style={{ gap: "7px" }}>
                      <span className="dot" style={{ width: "8px", height: "8px", background: sk.color }} />
                      <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)" }}>{sk.name}</span>
                    </div>
                    {sel && <span style={{ color: "var(--pink)" }}><AppIcon name="check" size="sm" strokeWidth={2.5} /></span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="btn btn-primary"
            disabled={ts.length === 0}
            onClick={() => setStep(2)}
          >
            Volgende: LUKs kiezen →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ fontSize: "var(--fs-base)", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Welke leeruitkomsten wil je in dit project aantonen?
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "10px", marginBottom: "24px" }}>
            {LUK_DEFS.map((luk) => {
              const sel = tl.includes(luk.id);
              return (
                <div
                  key={luk.id}
                  className={`onboard-card${sel ? " sel" : ""}`}
                  onClick={() => setTl(sel ? tl.filter((x) => x !== luk.id) : [...tl, luk.id])}
                >
                  <div className="flex-between" style={{ marginBottom: "6px" }}>
                    <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-base)" }}>{luk.name}</span>
                    {sel && <span style={{ color: "var(--pink)" }}><AppIcon name="check" size="sm" strokeWidth={2.5} /></span>}
                  </div>
                  <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    {luk.desc.substring(0, 80)}…
                  </p>
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{luk.criteria.length} succescriteria</p>
                </div>
              );
            })}
          </div>
          <div className="flex-center" style={{ gap: "10px" }}>
            {hasSkills && (
              <button className="btn-ghost" onClick={() => setStep(1)}>← Terug</button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => ctx.completeOnboarding(key, ts, tl)}
            >
              Aan de slag →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
