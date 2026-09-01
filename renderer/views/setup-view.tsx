import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { AppIcon } from "../components/AppIcon";
import markDuo from "../assets/brand/mark-duo.svg";

export function SetupView() {
  const ctx = useLogbookCtx();

  if (ctx.setupStep === "location") {
    return <LocationStep />;
  }
  return <ProfileStep />;
}

// ─── Step 1: choose where the logbook data is stored ─────────────────────
function LocationStep() {
  const ctx = useLogbookCtx();
  const [picking, setPicking] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handlePick = async () => {
    setPicking(true);
    try {
      const folder = await ctx.pickDataFolder();
      if (folder) setChosen(folder);
    } finally {
      setPicking(false);
    }
  };

  const handleConfirm = async () => {
    if (!chosen) return;
    setConfirming(true);
    try {
      await ctx.confirmDataFolder(chosen);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-logo">
          <h1>
            <img src={markDuo} alt="" className="setup-logo-icon" />
            <span className="setup-logo-text">LEVI</span>
          </h1>
        </div>

        <p className="field-label" style={{ marginBottom: "6px" }}>Waar wil je je logboekgegevens opslaan?</p>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.6" }}>
          Kies een map op je computer (bijvoorbeeld in je Documenten-map, of een gesynchroniseerde
          cloudmap). Al je projecten, ontwikkelmomenten en bewijsstukken worden hier als bestand
          opgeslagen.
        </p>

        <button
          className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", marginBottom: "12px", padding: "12px 14px" }}
          onClick={handlePick}
          disabled={picking}
        >
          <AppIcon name="folder" size="sm" />
          <span style={{ marginLeft: "8px" }}>{picking ? "Bezig…" : "Kies een map…"}</span>
        </button>

        {chosen && (
          <div className="subtle-box" style={{ marginBottom: "18px", wordBreak: "break-all" }}>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginBottom: "2px" }}>
              Gekozen map
            </p>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>{chosen}</p>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={!chosen || confirming}
          onClick={handleConfirm}
        >
          {confirming ? "Bezig…" : "Doorgaan →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: name + study year (original setup screen) ───────────────────
function ProfileStep() {
  const ctx = useLogbookCtx();
  const [name, setName] = useState(ctx.state.studentName || "");
  const [error, setError] = useState(false);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    ctx.completeSetup(trimmed);
  };

  return (
    <div className="setup-page">
      <div className="setup-card">
        {/* Logo */}
        <div className="setup-logo">
          <h1>
            <img src={markDuo} alt="" className="setup-logo-icon" />
            <span className="setup-logo-text">LEVI</span>
          </h1>
        </div>

        {ctx.dataFolder && (
          <div className="subtle-box" style={{ marginBottom: "18px", wordBreak: "break-all" }}>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginBottom: "2px" }}>
              Gegevens worden opgeslagen in
            </p>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>{ctx.dataFolder}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="warn-box" style={{ marginBottom: "22px" }}>
          <AppIcon name="alert" size="sm" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p className="warn-box-title">Disclaimer</p>
            <p>
              Door het invullen van bewijsstukken en skills in deze applicatie
              betekent het niet dat je een voldoende behaalt voor je portfolio. Dit
              is alleen een manier om bij te houden welke skills je hebt ontwikkeld.
            </p>
          </div>
        </div>

        {/* Name input */}
        <p className="field-label">Jouw naam</p>
        <input
          type="text"
          className={`input${error ? " error" : ""}`}
          placeholder="bv. Peter de Innovator"
          value={name}
          style={{ marginBottom: "18px" }}
          onChange={(e) => {
            setName(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />

        {/* Save button */}
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={handleSave}
        >
          Opslaan en starten
        </button>
      </div>
    </div>
  );
}
