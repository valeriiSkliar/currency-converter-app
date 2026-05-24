import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "@/lib/storage";

type ConverterState = {
  fromCurrency: string;
  toCurrency: string;
  setFromCurrency: (code: string) => void;
  setToCurrency: (code: string) => void;
};

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.remove(name),
};

export const useConverterStore = create<ConverterState>()(
  persist(
    set => ({
      fromCurrency: "USD",
      toCurrency: "EUR",
      setFromCurrency: code => set({ fromCurrency: code }),
      setToCurrency: code => set({ toCurrency: code }),
    }),
    {
      name: "converter-store",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
