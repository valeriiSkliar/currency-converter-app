import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenBackground } from "@/components/ui";
import { Menu as MenuIcon } from "@/components/ui/icons";
import { useDrawer } from "@/lib/drawer-context";
import { useColors } from "@/lib/hooks";

export default function HomeScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const colors = useColors();

  const strokeColor = colors.ink;

  return (
    <ScreenBackground className="px-6 py-4">
      {/* Header bar */}
      <View className="flex-row items-center justify-between pt-2 pb-4">
        {/* Burger Button */}
        <Pressable
          onPress={openDrawer}
          className="rounded-xl border border-line bg-surface p-3 active:opacity-80"
          accessibilityLabel="Open Menu"
        >
          <MenuIcon color={strokeColor} />
        </Pressable>

        <Text className="text-xl font-bold text-ink">
          Currency Converter
        </Text>

        {/* Placeholder spacer */}
        <View className="w-12" />
      </View>

      {/* Main Body Content */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-ink">Currency Converter</Text>
        <Text className="mt-2 text-ink-mute">Coming soon</Text>

        {__DEV__ && (
          <Pressable
            onPress={() => router.push("/style-guide")}
            className="absolute bottom-10 rounded-full bg-accent px-6 py-3 active:opacity-80"
          >
            <Text className="text-sm font-bold text-accent-ink">
              Open Style Guide
            </Text>
          </Pressable>
        )}
      </View>
    </ScreenBackground>
  );
}
