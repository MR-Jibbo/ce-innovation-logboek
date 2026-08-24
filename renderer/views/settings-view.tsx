import { useState, type MouseEvent } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { pk } from "../lib/use-logbook";
import type { VisibleProjects } from "../lib/types";
import { AppIcon } from "../components/AppIcon";

export function SettingsView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const [name, setName] = useState(state.studentName);
  const [selJaar, setSelJaar] = useState(state.studieJaar || 1);
  const [saved, setSaved] = useState(false);
  const [changingFolder, setChangingFolder] = useState(false);
  const [folderMoved, setFolderMoved] = useState(false);

  const defaultVP = {
    jaar1: state.studieJaar === 1 ? [0, 1, 2, 3, 4] : [],
    jaar2: state.studieJaar === 2 ? [5, 6, 7, 8] : [],
  };
  const [vpState, setVpState] = useState<VisibleProjects>(() => {
    const vp = state.visibleProjects;
    return {
      jaar1: vp?.jaar1 != null ? [...vp.jaar1] : [...defaultVP.jaar1],
      jaar2: vp?.jaar2 != null ? [...vp.jaar2] : [...defaultVP.jaar2],
    };
  });

  const VP = [
    { key: "jaar1" as const, label: "Jaar 1", indices: [0, 1, 2, 3, 4] },
    { key: "jaar2" as const, label: "Jaar 2", indices: [5, 6, 7, 8] },
  ];

  const handleJaarChange = (j: number) => {
    setSelJaar(j);
    setVpState({
      jaar1: j === 1 ? [0, 1, 2, 3, 4] : [],
      jaar2: j === 2 ? [5, 6, 7, 8] : [],
    });
  };

  const toggleVp = (key: "jaar1" | "jaar2", idx: number) => {
    setVpState((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(idx) ? arr.filter((x) => x !== idx) : [...arr, idx] };
    });
  };

  const handleSave = () => {
    ctx.saveSettings(name.trim(), selJaar, vpState);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangeFolder = async () => {
    setChangingFolder(true);
    try {
      const folder = await ctx.pickDataFolder();
      if (folder && folder !== ctx.dataFolder) {
        await ctx.changeDataFolder(folder);
        setFolderMoved(true);
        setTimeout(() => setFolderMoved(false), 2500);
      }
    } finally {
      setChangingFolder(false);
    }
  };

  const openStudioBeeftink = (e: MouseEvent) => {
    e.preventDefault();
    window.glazeAPI.glaze.ipc.invoke("app:openExternal", "https://studiobeeftink.nl");
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "860px" }}>
      <h1 className="page-title">Instellingen</h1>
      <p className="page-subtitle">Pas hier de algemene instellingen aan.</p>

      {/* Row 1: Name + Year */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>
        <div className="card">
          <h2 className="section-title" style={{ fontSize: "var(--fs-md)", marginBottom: "12px" }}>Naam</h2>
          <input
            type="text"
            className="input"
            value={name}
            placeholder="Jouw naam"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="card">
          <h2 className="section-title" style={{ fontSize: "var(--fs-md)", marginBottom: "12px" }}>Studiejaar</h2>
          <div className="flex-center" style={{ gap: "10px" }}>
            {[1, 2].map((j) => (
              <button
                key={j}
                className={`seg-btn${selJaar === j ? " sel" : ""}`}
                onClick={() => handleJaarChange(j)}
              >
                Jaar {j}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visible projects */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "4px" }}>
          Zichtbare onderdelen op dashboard
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "14px" }}>
          Verberg onderdelen die je niet wilt zien op het dashboard.
        </p>
        {VP.map(({ key, label, indices }) => (
          <div key={key}>
            <p style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-primary)", marginBottom: "8px", marginTop: "12px" }}>
              {label}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${indices.length}, 1fr)`, gap: "7px", marginBottom: "6px" }}>
              {indices.map((idx) => {
                const vis = vpState[key].includes(idx);
                const pName = pk(state.projNames, idx);
                return (
                  <button
                    key={idx}
                    className={`seg-btn${vis ? " sel" : ""}`}
                    style={{ padding: "7px 4px", fontSize: "var(--fs-xs)", lineHeight: "1.3" }}
                    onClick={() => toggleVp(key, idx)}
                  >
                    {pName}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Storage location */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "4px" }}>
          Opslaglocatie
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "14px" }}>
          De map op je computer waarin je logboekgegevens worden opgeslagen. Als je een
          nieuwe map kiest, wordt al je huidige data daarheen verplaatst.
        </p>

        {ctx.dataFolder && (
          <div className="subtle-box" style={{ marginBottom: "12px", wordBreak: "break-all" }}>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginBottom: "2px" }}>
              Huidige map
            </p>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>{ctx.dataFolder}</p>
          </div>
        )}

        <button
          className="btn-ghost"
          style={{ justifyContent: "flex-start", padding: "10px 14px" }}
          onClick={handleChangeFolder}
          disabled={changingFolder}
        >
          <AppIcon name="folder" size="sm" />
          <span style={{ marginLeft: "8px" }}>
            {changingFolder ? "Bezig met verplaatsen…" : folderMoved ? "Map gewijzigd ✓" : "Andere map kiezen…"}
          </span>
        </button>
      </div>

      {/* Disclaimer */}
      <div className="warn-box" style={{ marginBottom: "18px" }}>
        <AppIcon name="alert" size="sm" style={{ flexShrink: 0, marginTop: "1px" }} />
        <div>
          <p className="warn-box-title">Disclaimer</p>
          <p>
            Door het invullen van bewijsstukken en skills in deze applicatie betekent
            het niet dat je een voldoende behaalt voor je portfolio. Dit is alleen een
            manier om bij te houden welke skills je hebt ontwikkeld.
          </p>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? (
          <span className="flex-center" style={{ gap: "6px" }}>
            <AppIcon name="check" size="sm" strokeWidth={2.5} /> Opgeslagen
          </span>
        ) : (
          "Alles opslaan"
        )}
      </button>

      <p style={{ marginTop: "32px", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
        Better think{" "}
        <a
          href="https://studiobeeftink.nl"
          onClick={openStudioBeeftink}
          style={{ color: "inherit", textDecoration: "underline", cursor: "pointer" }}
        >
          Studio Beeftink
        </a>
        !
      </p>
    </div>
  );
}
