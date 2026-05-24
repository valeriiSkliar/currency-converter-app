import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "@/lib/storage";

export type ThemeType = "light" | "dark" | "system";

type SettingsState = {
  theme: ThemeType;
  fiatPrecision: number;
  cryptoPrecision: number;
  wallpaper: string;
  setTheme: (theme: ThemeType) => void;
  setFiatPrecision: (precision: number) => void;
  setCryptoPrecision: (precision: number) => void;
  setWallpaper: (wallpaper: string) => void;
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
      fiatPrecision: 2,
      cryptoPrecision: 6,
      wallpaper: "default",
      setTheme: theme => set({ theme }),
      setFiatPrecision: fiatPrecision => set({ fiatPrecision }),
      setCryptoPrecision: cryptoPrecision => set({ cryptoPrecision }),
      setWallpaper: wallpaper => set({ wallpaper }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
