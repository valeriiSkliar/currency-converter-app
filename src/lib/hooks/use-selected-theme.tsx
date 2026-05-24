import * as React from "react";
import { Uniwind } from "uniwind";

import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { storage } from "../storage";

export type ColorSchemeType = "light" | "dark" | "system";

/**
 * this hooks should only be used while selecting the theme
 * This hooks will return the selected theme which is stored in Zustand
 * selectedTheme should be one of the following values 'light', 'dark' or 'system'
 * don't use this hooks if you want to use it to style your component based on the theme use useUniwind from uniwind instead
 *
 */
export function useSelectedTheme() {
  const theme = useSettingsStore(state => state.theme);
  const setTheme = useSettingsStore(state => state.setTheme);

  const setSelectedTheme = React.useCallback(
    (t: ColorSchemeType) => {
      Uniwind.setTheme(t);
      setTheme(t);
    },
    [setTheme],
  );

  const selectedTheme = (theme ?? "system") as ColorSchemeType;
  return { selectedTheme, setSelectedTheme } as const;
}

// to be used in the root file to load the selected theme from MMKV
export function loadSelectedTheme() {
  const settingsJson = storage.getString("settings-store");
  if (settingsJson) {
    try {
      const parsed = JSON.parse(settingsJson);
      const theme = parsed?.state?.theme;
      if (theme) {
        Uniwind.setTheme(theme as ColorSchemeType);
      }
    }
    catch (e) {
      console.error("Failed to load persisted theme", e);
    }
  }
}
