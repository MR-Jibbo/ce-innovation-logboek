import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { ALL_SKILLS, LUK_DEFS } from "../lib/constants";
import { AppIcon } from "../components/AppIcon";

export function ProjectSettingsView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const key = ctx.cur();
  const hasSkills = state.projIdx < 5;
  const [tempName, setTempName] = useState(key);
  const [tempSkills, setTempSkills] = useState<string[]>([...(state.selectedSkillIds[key] || [])]);
  const [tempLuks, setTempLuks] = useState<string[]>([...(state.lukSelections[key] || [])]);

  const toggleSkill = (id: string) => {
    setTempSkills((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const toggleLuk = (id: string) => {
    setTempLuks((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSave = () => {
    const newName = tempName.trim() || key;
    ctx.saveProjectSettings(key, newName, tempSkills, tempLuks);
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

      {/* Skills (only jaar 1) */}
      {hasSkills && (
        <div className="card" style={{ marginBottom: "18px" }}>
          <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "4px" }}>Skills</h2>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "12px" }}>
            Kies welke skills je dit project wilt ontwikkelen.
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
                      <span className="dot" style={{ width: "8px", height: "8px", background: sk.color }} />
                      <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)" }}>{sk.name}</span>
                    </div>
                    {sel && <span style={{ color: sk.color }}><AppIcon name="check" size="sm" strokeWidth={2.5} /></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LUKs */}
      <div className="card" style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "4px" }}>Leeruitkomsten (LUK)</h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "12px" }}>
          Kies welke leeruitkomsten je dit project wilt aantonen.
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
