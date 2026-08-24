import { useLogbookCtx } from "../lib/logbook-context";
import { ALL_SKILLS, LUK_DEFS } from "../lib/constants";
import { AppIcon } from "../components/AppIcon";

export function ProjectView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const key = ctx.cur();
  const hasSkills = state.projIdx < 5;
  const psi = state.selectedSkillIds[key] || [];
  const pls = state.lukSelections[key] || [];
  const chosen = ALL_SKILLS.filter((s) => psi.includes(s.id));
  const activeLuks = LUK_DEFS.filter((l) => pls.includes(l.id));
  const pe = state.entries.filter((e) => e.periode === key);

  return (
    <div className="animate-fade-in">
      <div className="grid-fixed-2" style={{ alignItems: "start" }}>
        {/* Skills column */}
        {hasSkills && (
          <div>
            <h2 className="section-title">Skills</h2>
            {chosen.length === 0 ? (
              <div className="card" style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-base)", textAlign: "center", padding: "24px" }}>
                <p>Geen skills gekozen.</p>
                <button
                  className="btn-link"
                  style={{ marginTop: "6px" }}
                  onClick={() => ctx.navigate("proj-settings")}
                >
                  Kies via Projectinstellingen →
                </button>
              </div>
            ) : (
              chosen.map((skill) => {
                const se = pe.filter((e) => e.skillId === skill.id);
                const data = state.skillData[key]?.[skill.id] || {};
                return (
                  <div
                    key={skill.id}
                    className="card clickable-card"
                    style={{ marginBottom: "12px" }}
                    onClick={() => ctx.setModal({ type: "skillDetail", skillId: skill.id })}
                  >
                    <div className="flex-between" style={{ marginBottom: "6px" }}>
                      <div className="dot-row" style={{ gap: "9px" }}>
                        <span className="dot" style={{ width: "10px", height: "10px", background: skill.color }} />
                        <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-base)" }}>{skill.name}</span>
                      </div>
                      <div className="flex-center" style={{ gap: "7px" }}>
                        {se.length > 0 && <span className="chip chip-gray" style={{ fontSize: "var(--fs-xs)" }}>{se.length}</span>}
                        <span style={{ color: "var(--text-faint)" }}>
                          <AppIcon name="chevron-right" size="sm" strokeWidth={2} />
                        </span>
                      </div>
                    </div>
                    {data.plan && (
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {data.plan.substring(0, 70) + (data.plan.length > 70 ? "…" : "")}
                      </p>
                    )}
                    {se.length > 0 && (
                      <div style={{ marginTop: "8px", borderTop: "1px solid var(--border-faint)", paddingTop: "8px" }}>
                        {se.slice(0, 2).map((e) => (
                          <p
                            key={e.id}
                            style={{
                              fontSize: "var(--fs-sm)",
                              color: "var(--text-tertiary)",
                              margin: "3px 0",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {e.title}
                          </p>
                        ))}
                        {se.length > 2 && (
                          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-faint)", margin: "3px 0 0" }}>
                            +{se.length - 2} meer
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* LUK column */}
        <div>
          <h2 className="section-title">Leeruitkomsten</h2>
          {activeLuks.length === 0 ? (
            <div className="card" style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-base)", textAlign: "center", padding: "24px" }}>
              <p>Geen leeruitkomsten gekozen.</p>
              <button
                className="btn-link"
                style={{ marginTop: "6px" }}
                onClick={() => ctx.navigate("proj-settings")}
              >
                Kies via Projectinstellingen →
              </button>
            </div>
          ) : (
            activeLuks.map((luk) => {
              const ces = (critId: string) =>
                state.lukEntries.filter((e) => e.periode === key && e.lukId === luk.id && e.criterionId === critId);
              return (
                <div key={luk.id} className="card" style={{ marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "var(--fs-base)", fontWeight: "var(--fw-bold)", color: "var(--pink)", marginBottom: "12px" }}>
                    {luk.name}
                  </h3>
                  {luk.criteria.map((crit) => {
                    const critEntries = ces(crit.id);
                    return (
                      <div
                        key={crit.id}
                        className="clickable-card"
                        style={{ border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "11px 13px", marginBottom: "8px" }}
                        onClick={() =>
                          ctx.setModal({ type: "lukCritDetail", lukId: luk.id, criterionId: crit.id, periode: key })
                        }
                      >
                        <div className="flex-between" style={{ gap: "8px" }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)", color: "var(--text-primary)", lineHeight: "1.4" }}>
                              {crit.title}
                            </p>
                          </div>
                          <div className="flex-center" style={{ gap: "7px", flexShrink: 0 }}>
                            {critEntries.length > 0 && (
                              <span className="chip chip-gray" style={{ fontSize: "var(--fs-xs)" }}>{critEntries.length}</span>
                            )}
                            <span style={{ color: "var(--text-faint)" }}>
                              <AppIcon name="chevron-right" size="sm" strokeWidth={2} />
                            </span>
                          </div>
                        </div>
                        {critEntries.length > 0 && (
                          <div style={{ marginTop: "7px", borderTop: "1px solid var(--border-faint)", paddingTop: "7px" }}>
                            {critEntries.slice(0, 2).map((e) => (
                              <p
                                key={e.id}
                                style={{
                                  fontSize: "var(--fs-sm)",
                                  color: "var(--text-tertiary)",
                                  margin: "2px 0",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {e.text ? e.text.substring(0, 55) : "Bewijsstuk"}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
