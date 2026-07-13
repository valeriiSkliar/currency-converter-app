import {
  AD_ACTION_THRESHOLD,
  AD_MIN_INTERVAL_MS,
  shouldShowAd,
} from "@/features/ads/ad-frequency";
import { useAdFrequencyStore } from "@/features/ads/use-ad-frequency-store";

describe("shouldShowAd", () => {
  it("is false below the action threshold", () => {
    expect(
      shouldShowAd({ actionCount: AD_ACTION_THRESHOLD - 1, lastShownAt: null, now: 1000 }),
    ).toBe(false);
  });

  it("is true at the threshold when never shown before", () => {
    expect(
      shouldShowAd({ actionCount: AD_ACTION_THRESHOLD, lastShownAt: null, now: 1000 }),
    ).toBe(true);
  });

  it("is false when the minimum interval has not elapsed", () => {
    expect(
      shouldShowAd({
        actionCount: AD_ACTION_THRESHOLD,
        lastShownAt: 1000,
        now: 1000 + AD_MIN_INTERVAL_MS - 1,
      }),
    ).toBe(false);
  });

  it("is true when the minimum interval has elapsed", () => {
    expect(
      shouldShowAd({
        actionCount: AD_ACTION_THRESHOLD,
        lastShownAt: 1000,
        now: 1000 + AD_MIN_INTERVAL_MS,
      }),
    ).toBe(true);
  });
});

describe("useAdFrequencyStore", () => {
  beforeEach(() => {
    useAdFrequencyStore.setState({
      actionCount: 0,
      lastShownAt: null,
      forceRequested: false,
    });
  });

  it("registerAction increments the counter", () => {
    useAdFrequencyStore.getState().registerAction();
    useAdFrequencyStore.getState().registerAction();
    expect(useAdFrequencyStore.getState().actionCount).toBe(2);
  });

  it("markShown resets counter, records time, clears force flag", () => {
    useAdFrequencyStore.getState().registerAction();
    useAdFrequencyStore.getState().requestForceShow();
    useAdFrequencyStore.getState().markShown(42_000);
    const state = useAdFrequencyStore.getState();
    expect(state.actionCount).toBe(0);
    expect(state.lastShownAt).toBe(42_000);
    expect(state.forceRequested).toBe(false);
  });
});
