// In-app "lightbox" preview voor een Hulpmiddel-PDF: rendert alle pagina's
// als afbeeldingen in een scrollbare, overlay-achtige modal — de student
// hoeft niet naar een los systeemprogramma te schakelen om te "Bekijken".
//
// Gebruikt pdfjs-dist in de renderer (met canvas) — een ander pad dan de
// bestaande Node-only tekst-extractie in main/services/pdf-export.ts, die
// nergens rasterized. De ruwe bytes komen via IPC (hulpmiddelen:getData)
// binnen, want alleen het main process heeft bestandstoegang.
//
// Als het renderen om wat voor reden dan ook mislukt (bijv. een beschadigd
// bestand), valt de gebruiker terug op "Open in systeemviewer"
// (hulpmiddelen:open, hetzelfde pad als voorheen).

import { useEffect, useRef, useState } from "react";
import { useLogbookCtx } from "../lib/logbook-context";
import { HULPMIDDELEN } from "../data/hulpmiddelen";
import { AppIcon } from "../components/AppIcon";

// Module-scope zodat de worker maar één keer per app-sessie wordt
// geconfigureerd, niet opnieuw bij elke keer dat de lightbox opent.
let workerConfigured = false;

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

type Status = "loading" | "ready" | "error";

export function HulpmiddelLightbox({ hulpmiddelId, onClose }: { hulpmiddelId: string; onClose: () => void }) {
  const ctx = useLogbookCtx();
  const h = HULPMIDDELEN.find((x) => x.id === hulpmiddelId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [fallbackBusy, setFallbackBusy] = useState(false);

  useEffect(() => {
    if (!h) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");

    (async () => {
      try {
        const res = await ctx.getHulpmiddelData(h.bestandsnaam);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setErrorMsg(res.error || "Kon het bestand niet laden.");
          setStatus("error");
          return;
        }

        const bytes = base64ToUint8Array(res.data);
        const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
        if (!workerConfigured) {
          const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
          workerConfigured = true;
        }
        if (cancelled) return;

        const pdf = await pdfjsLib.getDocument({
          data: bytes,
          isEvalSupported: false,
          useSystemFonts: true,
        }).promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";
        const targetWidth = Math.min(container.clientWidth || 800, 820);

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const unscaled = page.getViewport({ scale: 1 });
          const scale = targetWidth / unscaled.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.className = "pdf-lightbox-page";
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const canvasContext = canvas.getContext("2d");
          if (!canvasContext) continue;
          container.appendChild(canvas);
          await page.render({ canvasContext, viewport }).promise;
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {
        console.error("[hulpmiddel-lightbox] Kon PDF niet renderen:", e);
        if (!cancelled) {
          setErrorMsg("Kon deze PDF niet als preview laten zien.");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hulpmiddelId]);

  if (!h) return null;

  const handleOpenSystemViewer = async () => {
    setFallbackBusy(true);
    try {
      const res = await ctx.openHulpmiddel(h.bestandsnaam);
      if (!res.success) {
        setErrorMsg(res.error || "Kon het bestand niet openen in de systeemviewer.");
      }
    } finally {
      setFallbackBusy(false);
    }
  };

  const handleDownload = async () => {
    await ctx.downloadHulpmiddel(h.bestandsnaam, h.bestandsnaam);
  };

  return (
    <>
      <div className="modal-header">
        <h2>{h.titel}</h2>
        <div className="flex-center" style={{ gap: "4px" }}>
          <button className="btn-icon" title="Downloaden" onClick={handleDownload}>
            <AppIcon name="download" size="sm" />
          </button>
          <button className="modal-close" onClick={onClose}>
            <AppIcon name="x" size="md" />
          </button>
        </div>
      </div>

      <div className="pdf-lightbox-body">
        {status === "loading" && (
          <p className="pdf-lightbox-status">Bezig met laden…</p>
        )}
        {status === "error" && (
          <div className="pdf-lightbox-status">
            <p style={{ marginBottom: "14px" }}>{errorMsg}</p>
            <button className="btn btn-primary" disabled={fallbackBusy} onClick={handleOpenSystemViewer}>
              Open in systeemviewer
            </button>
          </div>
        )}
        {/* Nooit door React beheerde children — pdfjs-dist tekent hier
            zelf canvas-elementen in (zie de effect hierboven). React en
            imperatieve DOM-writes moeten hetzelfde element nooit beide
            beheren, anders raakt React's reconciliatie in de war. */}
        <div ref={containerRef} style={{ display: status === "ready" ? "contents" : "none" }} />
      </div>
    </>
  );
}
