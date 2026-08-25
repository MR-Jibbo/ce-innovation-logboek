import { type ChangeEvent } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { AppIcon } from "../components/AppIcon";

export function ProfileView() {
  const ctx = useLogbookCtx();
  const { state } = ctx;

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Keep it small — this is stored inline in logbook-data.json.
        const max = 320;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          if (w > h) { h = Math.round(h * (max / w)); w = max; }
          else { w = Math.round(w * (max / h)); h = max; }
        }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
        ctx.setProfilePhoto(cv.toDataURL("image/jpeg", 0.85));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const totalMoments = state.entries.length;
  const totalProof = state.lukEntries.length;
  const startedProjects = Object.values(state.projOnboarded).filter(Boolean).length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: "640px" }}>
      <h1 className="page-title">Profiel</h1>
      <p className="page-subtitle">Je persoonlijke gegevens, zoals ze in de zijbalk verschijnen.</p>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="flex-center" style={{ gap: "18px" }}>
          {state.profilePhoto ? (
            <img src={state.profilePhoto} alt="" className="profile-avatar-lg" />
          ) : (
            <div className="profile-avatar-lg profile-avatar-lg-fallback">
              <AppIcon name="user" size="xl" />
            </div>
          )}
          <div>
            <p style={{ fontSize: "var(--fs-lg)", fontWeight: "var(--fw-bold)" }}>{state.studentName || "Naam nog niet ingesteld"}</p>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginBottom: "10px" }}>Student — Jaar {state.studieJaar}</p>
            <div className="flex-center" style={{ gap: "8px" }}>
              <label className="btn-ghost" style={{ fontSize: "var(--fs-sm)", padding: "6px 12px", cursor: "pointer" }}>
                <AppIcon name="camera" size="xs" /> Profielfoto wijzigen
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
              </label>
              {state.profilePhoto && (
                <button
                  className="btn-ghost"
                  style={{ fontSize: "var(--fs-sm)", padding: "6px 12px", color: "var(--danger)" }}
                  onClick={() => ctx.setProfilePhoto(null)}
                >
                  Verwijderen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-title">Jouw voortgang</h2>
      <div className="grid-3">
        <div className="stat-tile">
          <div style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-heavy)", color: "var(--pink)", lineHeight: "1" }}>{startedProjects}</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginTop: "5px" }}>Projecten gestart</div>
        </div>
        <div className="stat-tile">
          <div style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-heavy)", color: "var(--stat-orange)", lineHeight: "1" }}>{totalMoments}</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginTop: "5px" }}>Ontwikkelmomenten</div>
        </div>
        <div className="stat-tile">
          <div style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-heavy)", color: "var(--stat-purple)", lineHeight: "1" }}>{totalProof}</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", marginTop: "5px" }}>Bewijsstukken</div>
        </div>
      </div>

      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-faint)", marginTop: "18px" }}>
        Naam en studiejaar pas je aan via Instellingen.
      </p>
    </div>
  );
}
