import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "@/lib/storage";

export type ThemeType = "light" | "dark" | "system";
export type LanguageType = "en" | "ru";

type SettingsState = {
  theme: ThemeType;
  language: LanguageType;
  decimalPlaces: number;
  wallpaper: string;
  privacyAccepted: boolean;
  setTheme: (theme: ThemeType) => void;
  setLanguage: (language: LanguageType) => void;
  setDecimalPlaces: (decimalPlaces: number) => void;
  setWallpaper: (wallpaper: string) => void;
  setPrivacyAccepted: (accepted: boolean) => void;
};

const mmkvStorage = {
  getItem: (name: string) => {
    return storage.getString(name) ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: "system",
      language: "en",
      decimalPlaces: 2,
      wallpaper: "default",
      privacyAccepted: false,
      setTheme: theme => set({ theme }),
      setLanguage: language => set({ language }),
      setDecimalPlaces: decimalPlaces => set({ decimalPlaces }),
      setWallpaper: wallpaper => set({ wallpaper }),
      setPrivacyAccepted: privacyAccepted => set({ privacyAccepted }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
