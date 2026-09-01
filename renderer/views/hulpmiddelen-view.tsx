import { useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { HULPMIDDELEN, type Hulpmiddel } from "../data/hulpmiddelen";
import { AppIcon } from "../components/AppIcon";

export function HulpmiddelenView() {
  const ctx = useLogbookCtx();
  // Kleine, tijdelijke statusregel per tegel ("Opgeslagen ✓" / een foutmelding)
  // — geen nieuw meldingensysteem, gewoon lokale state die na een paar
  // seconden weer verdwijnt.
  const [status, setStatus] = useState<Record<string, string>>({});

  const setTileStatus = (id: string, msg: string) => {
    setStatus((prev) => ({ ...prev, [id]: msg }));
    setTimeout(() => {
      setStatus((prev) => {
        if (prev[id] !== msg) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 3000);
  };

  const handleView = async (h: Hulpmiddel) => {
    const result = await ctx.openHulpmiddel(h.bestandsnaam);
    if (!result.success) setTileStatus(h.id, "Kon de PDF niet openen.");
  };

  const handleDownload = async (h: Hulpmiddel) => {
    const result = await ctx.downloadHulpmiddel(h.bestandsnaam, h.bestandsnaam);
    if (result.success) setTileStatus(h.id, "Opgeslagen ✓");
    else if (!result.canceled) setTileStatus(h.id, "Opslaan mislukt.");
  };

  return (
    <div className="animate-fade-in">
      <div className="grid-3">
        {HULPMIDDELEN.map((h) => (
          <div key={h.id} className="card-sm" style={{ display: "flex", flexDirection: "column" }}>
            <div className="flex-between" style={{ gap: "8px", alignItems: "flex-start" }}>
              <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-sm)", lineHeight: "1.4" }}>{h.titel}</span>
              <div className="flex-center" style={{ gap: "2px", flexShrink: 0 }}>
                <button className="btn-icon" title="Bekijken" onClick={() => handleView(h)}>
                  <AppIcon name="eye" size="sm" />
                </button>
                <button className="btn-icon" title="Downloaden" onClick={() => handleDownload(h)}>
                  <AppIcon name="download" size="sm" />
                </button>
              </div>
            </div>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", lineHeight: "1.5", flex: 1, marginTop: "5px" }}>
              {h.beschrijving}
            </p>
            {status[h.id] && (
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginTop: "6px" }}>
                {status[h.id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
