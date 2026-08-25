import { useState, type MouseEvent } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { pk } from "../lib/use-logbook";
import type { VisibleProjects } from "../lib/types";
import { AppIcon } from "../components/AppIcon";
import { getThemePreference, setThemePreference, type ThemePreference } from "../lib/theme";
import { getFontScale, setFontScale, FONT_SCALE_MIN, FONT_SCALE_MAX, FONT_SCALE_STEP, FONT_SCALE_DEFAULT } from "../lib/font-size";

export function ProfileView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;
  const photoPos = state.profilePhotoPosition || { x: 50, y: 50 };

  // ─── Naam + studiejaar + zichtbare projecten ──────────────────────────────
  const [name, setName] = useState(state.studentName);
  const [selJaar, setSelJaar] = useState(state.studieJaar || 1);
  const [saved, setSaved] = useState(false);
  const [changingFolder, setChangingFolder] = useState(false);
  const [folderMoved, setFolderMoved] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference());
  const [fontScale, setFontScaleState] = useState<number>(getFontScale());

  const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
    { key: "light", label: "Licht" },
    { key: "dark", label: "Donker" },
    { key: "system", label: "Systeem" },
  ];

  const handleThemeChange = (pref: ThemePreference) => {
    setTheme(pref);
    setThemePreference(pref);
  };

  const handleFontScaleChange = (scale: number) => {
    setFontScaleState(scale);
    setFontScale(scale);
  };

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
      {/* Photo + naam + studiejaar */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <div className="flex-center" style={{ gap: "18px", alignItems: "flex-start" }}>
          <button
            className="avatar-hover-wrap"
            onClick={() => ctx.setModal({ type: "photoEditor" })}
            title="Profielfoto aanpassen"
          >
            {state.profilePhoto ? (
              <img
                src={state.profilePhoto}
                alt=""
                className="profile-avatar-lg"
                style={{ objectPosition: `${photoPos.x}% ${photoPos.y}%` }}
              />
            ) : (
              <div className="profile-avatar-lg profile-avatar-lg-fallback">
                <AppIcon name="user" size="xl" />
              </div>
            )}
            <span className="avatar-hover-overlay">
              <AppIcon name="camera" size="md" />
            </span>
          </button>
          <div style={{ flex: 1, paddingTop: "6px" }}>
            <p style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-primary)", marginBottom: "4px" }}>
              Profielfoto
            </p>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
              Hover over de foto en klik op het camera-icoontje om 'm te vervangen of de
              positionering aan te passen.
            </p>
          </div>
        </div>
      </div>

      {/* Naam + studiejaar */}
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
          Dit zijn je "Mijn projecten", verberg onderdelen die je niet wilt zien.
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

      {/* Thema */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "4px" }}>
          Thema
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "14px" }}>
          Kies een lichte of donkere weergave, of volg de instelling van je besturingssysteem.
        </p>
        <div className="flex-center" style={{ gap: "10px" }}>
          {THEME_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`seg-btn${theme === key ? " sel" : ""}`}
              onClick={() => handleThemeChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lettergrootte */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-bold)", marginBottom: "4px" }}>
          Lettergrootte
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "14px" }}>
          Pas de tekstgrootte in de hele app aan voor een betere leesbaarheid.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)", flexShrink: 0 }}>A</span>
          <input
            type="range"
            min={FONT_SCALE_MIN}
            max={FONT_SCALE_MAX}
            step={FONT_SCALE_STEP}
            value={fontScale}
            style={{ flex: 1 }}
            onChange={(e) => handleFontScaleChange(Number(e.target.value))}
          />
          <span style={{ fontSize: "19px", color: "var(--text-tertiary)", flexShrink: 0 }}>A</span>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", minWidth: "40px", textAlign: "right", flexShrink: 0 }}>
            {Math.round(fontScale * 100)}%
          </span>
        </div>
        {fontScale !== FONT_SCALE_DEFAULT && (
          <button
            className="btn-ghost"
            style={{ marginTop: "12px", fontSize: "var(--fs-xs)", padding: "6px 10px" }}
            onClick={() => handleFontScaleChange(FONT_SCALE_DEFAULT)}
          >
            Standaard herstellen
          </button>
        )}
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

      <button className="btn btn-primary" onClick={handleSave} style={{ marginBottom: "32px" }}>
        {saved ? (
          <span className="flex-center" style={{ gap: "6px" }}>
            <AppIcon name="check" size="sm" strokeWidth={2.5} /> Opgeslagen
          </span>
        ) : (
          "Alles opslaan"
        )}
      </button>

      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-faint)" }}>
        Een product van{" "}
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
