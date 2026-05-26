import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenBackground } from "@/components/ui";

export default function AddCurrencyScreen() {
  const router = useRouter();

  return (
    <ScreenBackground className="p-6">
      {/* Header */}
      <View className="mb-8 flex-row items-center pt-2">
        <Pressable
          onPress={() => router.back()}
          className="mr-4 rounded-full border border-line bg-surface p-3 active:opacity-80"
          accessibilityLabel="Go back"
        >
          <Text className="text-xl font-bold text-ink">←</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-ink">
          Add Currency
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center rounded-3xl border border-line bg-surface p-6">
        <Text className="mb-2 text-xl font-bold text-ink">
          Add Currency
        </Text>
        <Text className="text-center text-ink-mute">
          Search and add new fiat or crypto currencies to your converter list here.
        </Text>
      </View>
    </ScreenBackground>
  );
}
