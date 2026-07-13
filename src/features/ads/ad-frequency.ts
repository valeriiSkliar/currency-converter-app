export const AD_ACTION_THRESHOLD = 5;
export const AD_MIN_INTERVAL_MS = 3 * 60_000;

type AdFrequencyInput = {
  actionCount: number;
  lastShownAt: number | null;
  now: number;
};

export function shouldShowAd(input: AdFrequencyInput): boolean {
  if (input.actionCount < AD_ACTION_THRESHOLD) {
    return false;
  }

  return input.lastShownAt === null
    || input.now - input.lastShownAt >= AD_MIN_INTERVAL_MS;
}
