import * as React from "react";
import { useInterstitialAd } from "react-native-google-mobile-ads";
import { shouldShowAd } from "@/features/ads/ad-frequency";
import { getInterstitialAdUnitId } from "@/features/ads/ad-unit-ids";
import { useAdFrequencyStore } from "@/features/ads/use-ad-frequency-store";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";

export function useInterstitialGate(): void {
  const isPro = useQuotaStore(state => state.isPro);
  const actionCount = useAdFrequencyStore(state => state.actionCount);
  const lastShownAt = useAdFrequencyStore(state => state.lastShownAt);
  const forceRequested = useAdFrequencyStore(state => state.forceRequested);
  const markShown = useAdFrequencyStore(state => state.markShown);
  const { isClosed, isLoaded, load, show } = useInterstitialAd(
    getInterstitialAdUnitId(),
  );

  React.useEffect(() => {
    if (!isPro) {
      load();
    }
  }, [isClosed, isPro, load]);

  React.useEffect(() => {
    if (isPro || !isLoaded) {
      return;
    }

    const now = Date.now();
    if (forceRequested || shouldShowAd({ actionCount, lastShownAt, now })) {
      show();
      markShown(now);
    }
  }, [actionCount, forceRequested, isLoaded, isPro, lastShownAt, markShown, show]);
}
