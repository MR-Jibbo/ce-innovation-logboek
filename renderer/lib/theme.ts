// Theme preference (Licht / Donker / Systeem), stored per-device in
// localStorage — this is a UI preference, not portfolio data, so it does
// NOT go through the logbook-data.json backend store.

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

export function getThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // localStorage can throw in some contexts — fall through to default.
  }
  return "system";
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function computeIsDark(pref: ThemePreference): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return systemPrefersDark();
}

export function applyTheme(pref: ThemePreference): void {
  document.documentElement.classList.toggle("dark", computeIsDark(pref));
}

let systemListenerAttached = false;

/** Sets and immediately applies the theme preference. Also (once) attaches
 *  a listener so that, while "Systeem" is selected, a live OS theme change
 *  is reflected without needing to reopen the app. */
export function setThemePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // ignore — theme just won't persist across restarts in this context
  }
  applyTheme(pref);

  if (!systemListenerAttached) {
    systemListenerAttached = true;
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (getThemePreference() === "system") applyTheme("system");
    });
  }
}
