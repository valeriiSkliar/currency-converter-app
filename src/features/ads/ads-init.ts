import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import mobileAds, { AdsConsent } from "react-native-google-mobile-ads";

let started = false;

export async function initializeAds(): Promise<void> {
  if (started) {
    return;
  }

  started = true;
  try {
    await AdsConsent.gatherConsent();
    await requestTrackingPermissionsAsync();
    await mobileAds().initialize();
  }
  catch {
    // Non-fatal: the app remains fully usable without ads.
  }
}
