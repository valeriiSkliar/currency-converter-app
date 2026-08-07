import Env from "env";
import * as React from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";

import Svg, { Path } from "react-native-svg";
import { translate } from "@/lib/i18n";
import { useAppUpdate } from "../context/app-update-context";

function UpdateIcon() {
  return (
    <View className="mb-6 size-20 items-center justify-center rounded-3xl bg-accent/20">
      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 4V14M12 14L8 10M12 14L16 10M4 18H20"
          stroke="#FFD200"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function AppUpdateScreen() {
  const { installedVersion, requiredVersion, dismissDebugUpdate } = useAppUpdate();
  const [isLoading, setIsLoading] = React.useState(false);

  const openStore = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === "ios") {
        const iosUrl = Env.EXPO_PUBLIC_RATE_URL_IOS;
        const canOpen = await Linking.canOpenURL(iosUrl);
        if (canOpen) {
          await Linking.openURL(iosUrl);
        }
        else {
          throw new Error("Cannot open App Store");
        }
      }
      else if (Platform.OS === "android") {
        const packageName = Env.EXPO_PUBLIC_PACKAGE;
        const marketUrl = `market://details?id=${packageName}`;
        const webUrl = Env.EXPO_PUBLIC_RATE_URL_ANDROID;

        const canOpenMarket = await Linking.canOpenURL(marketUrl).catch(() => false);
        if (canOpenMarket) {
          await Linking.openURL(marketUrl);
        }
        else {
          await Linking.openURL(webUrl);
        }
      }
    }
    catch {
      showMessage({
        message: translate("app_update.store_error"),
        type: "danger",
      });
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6 text-center">
        <UpdateIcon />

        <Text className="mb-3 text-center text-2xl font-bold text-ink">
          {translate("app_update.title")}
        </Text>

        <Text className="mb-6 text-center text-base text-ink-mute">
          {translate("app_update.message")}
        </Text>

        {(installedVersion || requiredVersion) && (
          <View className="mb-8 items-center rounded-xl bg-surface px-4 py-3">
            {installedVersion && (
              <Text className="text-xs text-ink-mute">
                {translate("app_update.current_version", { version: installedVersion })}
              </Text>
            )}
            {requiredVersion && (
              <Text className="mt-1 text-xs font-semibold text-ink">
                {translate("app_update.required_version", { version: requiredVersion })}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={openStore}
          disabled={isLoading}
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-center rounded-2xl bg-accent py-4"
          accessibilityRole="button"
          accessibilityLabel={translate("app_update.update_button")}
        >
          {isLoading
            ? (
                <ActivityIndicator color="#0E0E10" />
              )
            : (
                <Text className="text-center text-base font-bold text-[#0E0E10]">
                  {translate("app_update.update_button")}
                </Text>
              )}
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity
            onPress={dismissDebugUpdate}
            activeOpacity={0.7}
            className="mt-6 py-2"
          >
            <Text className="text-center text-sm font-semibold text-ink-mute underline">
              {translate("app_update.debug_close")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
