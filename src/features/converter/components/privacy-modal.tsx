import Env from "env";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Modal, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { exitApp, isAndroid } from "@/lib/platform";

type PrivacyModalProps = {
  visible: boolean;
  onAccept: () => void;
};

export function PrivacyModal({ visible, onAccept }: PrivacyModalProps) {
  const { t } = useTranslation();

  const handleDecline = () => {
    if (isAndroid) {
      exitApp();
    }
    else {
      Alert.alert(
        t("common.error", "Error"),
        t("privacy.decline_blocked", "You must accept the privacy policy to use the app."),
      );
    }
  };

  const handleOpenLink = () => {
    Linking.openURL(Env.EXPO_PUBLIC_PRIVACY_POLICY_URL).catch(() => {});
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        <View className="w-full max-w-[320px] items-center rounded-[28px] border border-line bg-surface p-6 shadow-2xl">
          <ShieldIcon />

          {/* Title */}
          <Text className="mb-2 text-center text-xl font-bold text-ink">
            {t("privacy.title")}
          </Text>

          {/* Description */}
          <Text className="mb-5 text-center text-xs/relaxed text-ink-mute">
            {t("privacy.description")}
          </Text>

          <BulletPoints t={t} />

          {/* Link */}
          <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.7} className="mb-6">
            <Text className="text-center text-xs font-bold text-blue underline">
              {t("privacy.link")}
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View className="w-full space-y-2">
            {/* Accept Button */}
            <TouchableOpacity
              onPress={onAccept}
              activeOpacity={0.8}
              className="w-full items-center justify-center rounded-2xl bg-ink py-3.5"
            >
              <Text className="text-sm font-bold text-surface">
                {t("privacy.accept")}
              </Text>
            </TouchableOpacity>

            {/* Decline Button */}
            <TouchableOpacity
              onPress={handleDecline}
              activeOpacity={0.8}
              className="w-full items-center justify-center rounded-2xl border border-line bg-surface-2 py-3.5"
            >
              <Text className="text-sm font-bold text-ink-mute">
                {t("privacy.decline")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ShieldIcon() {
  return (
    <View className="mb-4 rounded-[20px] bg-blue/10 p-4 dark:bg-blue/10">
      <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke="#0057B7"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M9 11l2 2 4-4"
          stroke="#0057B7"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function BulletPoints({ t }: { t: any }) {
  return (
    <View className="mb-6 w-full space-y-2">
      <View className="flex-row items-center">
        <Text className="mr-2 text-sm font-bold text-green">✓</Text>
        <Text className="flex-1 text-xs font-medium text-ink-2">
          {t("privacy.bullet1")}
        </Text>
      </View>
      <View className="flex-row items-center">
        <Text className="mr-2 text-sm font-bold text-green">✓</Text>
        <Text className="flex-1 text-xs font-medium text-ink-2">
          {t("privacy.bullet2")}
        </Text>
      </View>
      <View className="flex-row items-center">
        <Text className="mr-2 text-sm font-bold text-green">✓</Text>
        <Text className="flex-1 text-xs font-medium text-ink-2">
          {t("privacy.bullet3")}
        </Text>
      </View>
    </View>
  );
}
