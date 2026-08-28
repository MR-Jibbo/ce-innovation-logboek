import { useState, type MouseEvent } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { AppIcon } from "../components/AppIcon";
import { getThemePreference, setThemePreference, type ThemePreference } from "../lib/theme";
import { getFontScale, setFontScale, FONT_SCALE_MIN, FONT_SCALE_MAX, FONT_SCALE_STEP, FONT_SCALE_DEFAULT } from "../lib/font-size";

export function ProfileView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

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
      {/* Naam — wijzigingen worden automatisch opgeslagen */}
      <div className="card" style={{ marginBottom: "18px" }}>
        <h2 className="section-title" style={{ fontSize: "var(--fs-md)", marginBottom: "12px" }}>Naam</h2>
        <input
          type="text"
          className="input"
          value={state.studentName}
          placeholder="Jouw naam"
          onChange={(e) => ctx.saveSettings(e.target.value)}
        />
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
