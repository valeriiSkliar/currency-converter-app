import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "@/lib/storage";

type QuotaState = {
  isPro: boolean;
  customRateAttempts: number;
  ocrScanAttempts: number;
  incrementRateAttempt: () => void;
  incrementScanAttempt: () => void;
  unlockPro: () => void;
  resetAttempts: () => void;
};

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.remove(name),
};

export const useQuotaStore = create<QuotaState>()(
  persist(
    set => ({
      isPro: false,
      customRateAttempts: 0,
      ocrScanAttempts: 0,
      incrementRateAttempt: () =>
        set(state => ({
          customRateAttempts: state.customRateAttempts + 1,
        })),
      incrementScanAttempt: () =>
        set(state => ({
          ocrScanAttempts: state.ocrScanAttempts + 1,
        })),
      unlockPro: () => set({ isPro: true }),
      resetAttempts: () => set({ customRateAttempts: 0, ocrScanAttempts: 0 }),
    }),
    {
      name: "quota-store",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
