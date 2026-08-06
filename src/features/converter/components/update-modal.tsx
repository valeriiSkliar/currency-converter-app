import * as React from "react";
import { useTranslation } from "react-i18next";
import { Linking, Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type UpdateModalProps = {
  visible: boolean;
  minVersion: string | null;
  currentVersion: string;
};

export function UpdateModal({ visible, minVersion, currentVersion }: UpdateModalProps) {
  const { t } = useTranslation();

  const handleUpdate = () => {
    const storeUrl = Platform.select({
      ios: "https://apps.apple.com",
      android: "https://play.google.com/store",
      default: "https://play.google.com/store",
    });

    Linking.openURL(storeUrl).catch(() => {});
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        <View className="w-full max-w-[320px] items-center rounded-[28px] border border-line bg-surface p-6 shadow-2xl">
          <UpdateIcon />

          {/* Title */}
          <Text className="mb-2 text-center text-xl font-bold text-ink">
            {t("update.title", "Update Available")}
          </Text>

          {/* Description */}
          <Text className="mb-4 text-center text-xs/relaxed text-ink-mute">
            {t("update.description", {
              minVersion: minVersion || "1.0.0",
              defaultValue: `A new version of the app (v${minVersion || "1.0.0"}) is required to continue. Please update to get the latest features.`,
            })}
          </Text>

          {/* Version badge */}
          <View className="mb-6 rounded-full border border-line bg-surface-2 px-3 py-1">
            <Text className="text-[10px] font-semibold text-ink-mute">
              {t("update.current_version", {
                version: currentVersion,
                defaultValue: `Current version: v${currentVersion}`,
              })}
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleUpdate}
            activeOpacity={0.8}
            className="w-full items-center justify-center rounded-2xl bg-ink py-3.5"
          >
            <Text className="text-sm font-bold text-surface">
              {t("update.button", "Update Now")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function UpdateIcon() {
  return (
    <View className="mb-4 rounded-[20px] bg-blue/10 p-4 dark:bg-blue/10">
      <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
          stroke="#0057B7"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M3 3v5h5"
          stroke="#0057B7"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
          stroke="#0057B7"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 16h5v5"
          stroke="#0057B7"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
