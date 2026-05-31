import type { Edge } from "react-native-safe-area-context";
import * as React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const wallpaper = useSettingsStore(state => state.wallpaper);

  // Future-proof wallpaper styling classes hook
  const backgroundStyle = "flex-1 bg-bg";
  if (wallpaper !== "default") {
    // Switch on future wallpaper identifiers
    // e.g. case "neon": backgroundStyle = "flex-1 bg-black";
  }

  const containerClassName = `${backgroundStyle} ${className}`;

  return (
    <SafeAreaView edges={edges} className={containerClassName}>
      <FocusAwareStatusBar />
      {children}
    </SafeAreaView>
  );
}
