import type { ConfigContext, ExpoConfig } from "@expo/config";

import type { AppIconBadgeConfig } from "app-icon-badge/types";

import "tsx/cjs";

// adding lint exception as we need to import tsx/cjs before env.ts is imported
// eslint-disable-next-line perfectionist/sort-imports
import Env from "./env";

const EXPO_ACCOUNT_OWNER = Env.EXPO_ACCOUNT_OWNER;
const EAS_PROJECT_ID = Env.EAS_PROJECT_ID ?? "";

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.EXPO_PUBLIC_APP_ENV !== "production",
  badges: [
    {
      text: Env.EXPO_PUBLIC_APP_ENV,
      type: "banner",
      color: "white",
    },
    {
      text: Env.EXPO_PUBLIC_VERSION.toString(),
      type: "ribbon",
      color: "white",
    },
  ],
};

const cameraPlugin = [
  "expo-camera",
  {
    cameraPermission:
      "Allow Convertoff Currency Converter to use your camera to scan prices.",
    microphonePermission: false,
    recordAudioAndroid: false,
  },
] satisfies NonNullable<ExpoConfig["plugins"]>[number];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.EXPO_PUBLIC_NAME,
  description: `${Env.EXPO_PUBLIC_NAME} Mobile App`,
  owner: EXPO_ACCOUNT_OWNER,
  scheme: Env.EXPO_PUBLIC_SCHEME,
  slug: "currency-converter",
  version: Env.EXPO_PUBLIC_VERSION.toString(),
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: Env.EXPO_PUBLIC_BUNDLE_ID,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  experiments: {
    typedRoutes: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    package: Env.EXPO_PUBLIC_PACKAGE,
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    [
      "expo-splash-screen",
      {
        backgroundColor: "#000000",
        image: "./assets/splash-icon.png",
        imageWidth: 150,
      },
    ],
    [
      "expo-font",
      {
        ios: {
          fonts: [
            "node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf",
            "node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf",
            "node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf",
            "node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf",
          ],
        },
        android: {
          fonts: [
            {
              fontFamily: "Inter",
              fontDefinitions: [
                {
                  path: "node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf",
                  weight: 400,
                },
                {
                  path: "node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf",
                  weight: 500,
                },
                {
                  path: "node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf",
                  weight: 600,
                },
                {
                  path: "node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf",
                  weight: 700,
                },
              ],
            },
          ],
        },
      },
    ],
    "expo-localization",
    "expo-router",
    ["app-icon-badge", appIconBadgeConfig],
    ["react-native-edge-to-edge"],
    cameraPlugin,
    "expo-iap",
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? "ca-app-pub-3940256099942544~3347511713",
        iosAppId: process.env.ADMOB_IOS_APP_ID ?? "ca-app-pub-3940256099942544~1458002511",
      },
    ],
    [
      "expo-tracking-transparency",
      {
        userTrackingPermission: "This identifier will be used to show you more relevant ads.",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
