import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { ScreenBackground } from "@/components/ui";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenBackground className="p-6">
      {/* Header */}
      <View className="mb-8 flex-row items-center pt-2">
        <Pressable
          onPress={() => router.back()}
          className="mr-4 rounded-full border border-line bg-surface p-3 active:opacity-80"
        >
          <Text className="text-xl font-bold text-ink">←</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-ink">
          {t("drawer.settings")}
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center rounded-3xl border border-line bg-surface p-6">
        <Text className="mb-2 text-xl font-bold text-ink">
          {t("drawer.settings")}
        </Text>
        <Text className="text-center text-ink-mute">
          Change theme, language, precision format and developer settings options here.
        </Text>
      </View>
    </ScreenBackground>
  );
}
