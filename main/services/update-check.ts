/**
 * Update check — polls the GitHub Releases API for a newer published
 * version than the one currently running, so the renderer can show a
 * "Nieuwe versie beschikbaar" banner.
 *
 * Deliberately simple and fail-silent: any network error, non-200
 * response, or unexpected payload just means "no update info available"
 * (never throws, never surfaces an error to the user) — the banner
 * simply doesn't show. Runs in the main process because the renderer's
 * CSP (`connect-src 'self'`) blocks a fetch to api.github.com directly.
 */

const REPO = "MR-Jibbo/ce-innovation-logboek";
const RELEASES_API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const FETCH_TIMEOUT_MS = 5000;

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
}

/** Parses a version string like "v2.2.0" or "2.2.0" into [2, 2, 0]. */
function parseVersion(version: string): number[] {
  return version
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);
}

/** Returns true if `a` is strictly newer than `b` (simple numeric semver compare). */
function isNewer(a: string, b: string): boolean {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da > db;
  }
  return false;
}

interface GithubReleaseResponse {
  tag_name?: string;
  html_url?: string;
  assets?: Array<{ browser_download_url?: string; name?: string }>;
}

/**
 * Checks the latest GitHub release against `currentVersion`. Returns
 * `null` if the check couldn't complete for any reason — callers should
 * treat that the same as "no update" and not show anything.
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateCheckResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(RELEASES_API_URL, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) return null;

    const data = (await response.json()) as GithubReleaseResponse;
    const tagName = data.tag_name;
    const releaseUrl = data.html_url;
    if (!tagName || !releaseUrl) return null;

    const latestVersion = tagName.replace(/^v/i, "");

    return {
      hasUpdate: isNewer(latestVersion, currentVersion),
      currentVersion,
      latestVersion,
      releaseUrl,
    };
  } catch {
    return null;
  }
}
