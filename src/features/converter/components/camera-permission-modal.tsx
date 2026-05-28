import * as React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { CameraIcon } from "@/components/ui/icons";

type CameraPermissionModalProps = {
  visible: boolean;
  onAllow: () => void;
  onDecline: () => void;
};

export function CameraPermissionModal({
  visible,
  onAllow,
  onDecline,
}: CameraPermissionModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        <View className="w-full max-w-[320px] items-center rounded-[28px] border border-line bg-surface p-6 shadow-2xl">
          {/* Circular Camera Icon Container */}
          <View className="mb-4 rounded-full bg-ink/5 p-4 dark:bg-ink/10">
            <CameraIcon color="var(--color-ink)" size={32} />
          </View>

          {/* Title */}
          <Text className="mb-2 text-center text-xl font-bold text-ink">
            {t("converter.cameraPermissionTitle")}
          </Text>

          {/* Description */}
          <Text className="mb-6 text-center text-xs/relaxed font-semibold text-ink-mute">
            {t("converter.cameraPermissionText")}
          </Text>

          {/* Action Buttons */}
          <View className="w-full space-y-2">
            {/* Allow Button */}
            <TouchableOpacity
              onPress={onAllow}
              activeOpacity={0.8}
              className="w-full items-center justify-center rounded-2xl bg-ink py-3.5"
            >
              <Text className="text-sm font-bold text-bg">
                {t("converter.allow")}
              </Text>
            </TouchableOpacity>

            {/* Don't Allow Button */}
            <TouchableOpacity
              onPress={onDecline}
              activeOpacity={0.8}
              className="w-full items-center justify-center rounded-2xl border border-line bg-surface-2 py-3.5"
            >
              <Text className="text-sm font-bold text-ink-mute">
                {t("converter.dontAllow")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
