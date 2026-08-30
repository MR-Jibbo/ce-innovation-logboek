// Whether the brief, non-blocking "bevestigingsanimatie" (a small
// confetti-ish burst celebrating that a moment was logged) is shown.
// Stored per-device in localStorage — a UI preference, not portfolio data,
// so it does NOT go through the logbook-data.json backend store. Mirrors
// renderer/lib/theme.ts. Defaults to on; some students find any motion
// distracting, so it's a one-click toggle in Instellingen.

const STORAGE_KEY = "celebration-enabled";

export function getCelebrationEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    // localStorage can throw in some contexts — fall through to default.
  }
  return true;
}

export function setCelebrationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore — preference just won't persist across restarts in this context
  }
}
