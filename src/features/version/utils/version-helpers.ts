/**
 * Compares two semantic version strings (e.g., "1.0.0", "1.2.3", "2.0").
 * Returns true if `currentVersion` is strictly lower than `minVersion`.
 */
export function isVersionOutdated(currentVersion: string, minVersion: string): boolean {
  if (!currentVersion || !minVersion) {
    return false;
  }

  const cleanCurrent = currentVersion.trim().replace(/^v/i, "");
  const cleanMin = minVersion.trim().replace(/^v/i, "");

  const currentParts = cleanCurrent.split(".").map(p => Number.parseInt(p, 10) || 0);
  const minParts = cleanMin.split(".").map(p => Number.parseInt(p, 10) || 0);

  const maxLength = Math.max(currentParts.length, minParts.length);

  for (let i = 0; i < maxLength; i++) {
    const currentNum = currentParts[i] ?? 0;
    const minNum = minParts[i] ?? 0;

    if (currentNum < minNum) {
      return true;
    }
    if (currentNum > minNum) {
      return false;
    }
  }

  return false;
}
