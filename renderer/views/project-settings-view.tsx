import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { ALL_SKILLS, LUK_DEFS } from "../lib/constants";
import { AppIcon } from "../components/AppIcon";

export function ProjectSettingsView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const project = state.projects.find((p) => p.id === state.projectId);
  if (!project) return null;

  const [tempName, setTempName] = useState(project.naam);
  const [tempSkills, setTempSkills] = useState<string[]>([...project.skillIds]);
  const [tempLuks, setTempLuks] = useState<string[]>([...project.lukIds]);
  const [lukError, setLukError] = useState(false);

  const toggleSkill = (id: string) => {
    setTempSkills((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const toggleLuk = (id: string) => {
    setTempLuks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length > 0) setLukError(false);
      return next;
    });
  };

  const handleSave = () => {
    if (tempLuks.length === 0) {
      setLukError(true);
      return;
    }
    const newName = tempName.trim() || project.naam;
    ctx.updateProjectSettings(project.id, newName, tempLuks, tempSkills);
    ctx.navigate("project");
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "680px" }}>
      {/* Project name */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "10px" }}>Projectnaam</h2>
        <input
          type="text"
          className="input"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
        />
      </div>

      {/* Skills — always editable, ook voor een project dat nog geen skills had */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "4px" }}>Skills</h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "12px" }}>
          Optioneel — kies welke skills je in dit project wilt ontwikkelen.
        </p>
        <div className="grid-3">
          {ALL_SKILLS.map((sk) => {
            const sel = tempSkills.includes(sk.id);
            return (
              <div
                key={sk.id}
                className="onboard-card"
                style={sel ? { borderColor: sk.color, background: `${sk.color}08` } : {}}
                onClick={() => toggleSkill(sk.id)}
              >
                <div className="flex-between">
                  <div className="dot-row" style={{ gap: "6px" }}>
                    <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)" }}>{sk.name}</span>
                  </div>
                  {sel && <span style={{ color: sk.color }}><AppIcon name="check" size="sm" strokeWidth={2.5} /></span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LUKs — verplicht, minstens 1 */}
      <div className="card" style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "4px" }}>Leeruitkomsten (LUK)</h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "12px" }}>
          Verplicht — kies welke leeruitkomsten je in dit project wilt aantonen (minstens 1).
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "10px" }}>
          {LUK_DEFS.map((luk) => {
            const sel = tempLuks.includes(luk.id);
            return (
              <div
                key={luk.id}
                className={`onboard-card${sel ? " sel" : ""}`}
                onClick={() => toggleLuk(luk.id)}
              >
                <div className="flex-between" style={{ marginBottom: "5px" }}>
                  <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)" }}>{luk.name}</span>
                  {sel && <span style={{ color: "var(--pink)" }}><AppIcon name="check" size="sm" strokeWidth={2.5} /></span>}
                </div>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{luk.criteria.length} succescriteria</p>
              </div>
            );
          })}
        </div>
        {lukError && (
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--danger)", marginTop: "10px" }}>
            Kies minstens één leeruitkomst.
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex-center" style={{ gap: "10px" }}>
        <button className="btn btn-primary" onClick={handleSave}>
          Opslaan en terug naar project
        </button>
        <button className="btn-ghost" onClick={() => ctx.navigate("project")}>
          Annuleren
        </button>
      </div>
    </div>
  );
}
