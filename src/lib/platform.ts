import { BackHandler, Platform } from "react-native";

export const isAndroid = Platform.OS === "android";
export const isIOS = Platform.OS === "ios";
export const isWeb = Platform.OS === "web";
export const isDev = __DEV__;

/**
 * Select a value based on the active platform.
 */
export function platformSelect<T>(options: {
  android: T;
  ios: T;
  default?: T;
}): T {
  if (isAndroid) {
    return options.android;
  }
  if (isIOS) {
    return options.ios;
  }
  return options.default !== undefined ? options.default : options.android;
}

/**
 * Exits the app programmatically.
 * On Android, uses native exit behavior.
 */
export function exitApp() {
  if (isAndroid) {
    BackHandler.exitApp();
  }
}
