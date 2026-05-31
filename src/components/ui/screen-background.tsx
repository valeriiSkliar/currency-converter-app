import type { Edge } from "react-native-safe-area-context";
import * as React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { FocusAwareStatusBar } from "./focus-aware-status-bar";

type Props = {
  children: React.ReactNode;
  className?: string;
  edges?: Edge[];
};

export function ScreenBackground({
  children,
  className = "",
  edges = ["top", "bottom", "left", "right"],
}: Props) {
  const insets = useSafeAreaInsets();
  const wallpaper = useSettingsStore(state => state.wallpaper);

  // Future-proof wallpaper styling classes hook
  const backgroundStyle = "flex-1 bg-bg";
  if (wallpaper !== "default") {
    // Switch on future wallpaper identifiers
    // e.g. case "neon": backgroundStyle = "flex-1 bg-black";
  }

  const containerClassName = `${backgroundStyle} ${className}`;

  return (
    <View
      className={containerClassName}
      style={{
        paddingTop: edges.includes("top") ? insets.top : 0,
        paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
        paddingLeft: edges.includes("left") ? insets.left : 0,
        paddingRight: edges.includes("right") ? insets.right : 0,
      }}
    >
      <FocusAwareStatusBar />
      {children}
    </View>
  );
}
