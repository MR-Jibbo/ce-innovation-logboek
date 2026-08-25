// Font-size preference (a "Lettergrootte"-slider in Instellingen), stored
// per-device in localStorage — this is a UI preference, not portfolio data,
// so it does NOT go through the logbook-data.json backend store. Mirrors
// renderer/lib/theme.ts.
//
// The stored value is a multiplier applied to the --fs-scale CSS custom
// property (see :root in styles.css), which every --fs-* design token is
// built from — so one slider scales all app text. Deliberately excludes the
// splash screen, which uses fixed px sizes instead of the --fs-* tokens.

const STORAGE_KEY = "font-scale";

export const FONT_SCALE_MIN = 0.85;
export const FONT_SCALE_MAX = 1.3;
export const FONT_SCALE_DEFAULT = 1;
export const FONT_SCALE_STEP = 0.05;

function clamp(scale: number): number {
  if (Number.isNaN(scale)) return FONT_SCALE_DEFAULT;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
}

export function getFontScale(): number {
  try {
    const v = parseFloat(localStorage.getItem(STORAGE_KEY) || "");
    if (!Number.isNaN(v)) return clamp(v);
  } catch {
    // localStorage can throw in some contexts — fall through to default.
  }
  return FONT_SCALE_DEFAULT;
}

export function applyFontScale(scale: number): void {
  document.documentElement.style.setProperty("--fs-scale", String(clamp(scale)));
}

/** Sets and immediately applies the font-scale preference. */
export function setFontScale(scale: number): void {
  const clamped = clamp(scale);
  try {
    localStorage.setItem(STORAGE_KEY, String(clamped));
  } catch {
    // ignore — preference just won't persist across restarts in this context
  }
  applyFontScale(clamped);
}
