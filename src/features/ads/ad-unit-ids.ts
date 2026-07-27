import Env from "env";
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

export function getInterstitialAdUnitId(): string {
  if (Env.EXPO_PUBLIC_APP_ENV !== "production") {
    return TestIds.INTERSTITIAL;
  }

  const realId = Platform.select({
    android: Env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID,
    ios: Env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS,
  });
  return realId ?? TestIds.INTERSTITIAL;
}
