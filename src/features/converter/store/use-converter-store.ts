import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "@/lib/storage";

type ConverterState = {
  baseCurrency: string;
  targetCurrencies: string[];
  amount: string;
  customRates: Record<string, number>;
  setBaseCurrency: (code: string) => void;
  setTargetCurrencies: (codes: string[]) => void;
  swapBaseWithRow: (targetCode: string) => void;
  addCurrency: (code: string) => void;
  removeCurrency: (code: string) => void;
  updateAmount: (val: string) => void;
  setCustomRate: (pair: string, rate: number) => void;
};

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.remove(name),
};

export const useConverterStore = create<ConverterState>()(
  persist(
    set => ({
      baseCurrency: "USD",
      targetCurrencies: ["EUR", "GBP", "JPY", "BTC"],
      amount: "100",
      customRates: {},
      setBaseCurrency: code => set({ baseCurrency: code }),
      setTargetCurrencies: codes => set({ targetCurrencies: codes }),
      swapBaseWithRow: targetCode =>
        set((state) => {
          const index = state.targetCurrencies.indexOf(targetCode);
          if (index === -1)
            return {};
          const nextTargets = [...state.targetCurrencies];
          nextTargets[index] = state.baseCurrency;
          return {
            baseCurrency: targetCode,
            targetCurrencies: nextTargets,
          };
        }),
      addCurrency: code =>
        set((state) => {
          if (
            state.targetCurrencies.includes(code)
            || state.baseCurrency === code
          ) {
            return {};
          }
          return {
            targetCurrencies: [...state.targetCurrencies, code],
          };
        }),
      removeCurrency: code =>
        set(state => ({
          targetCurrencies: state.targetCurrencies.filter(c => c !== code),
        })),
      updateAmount: val => set({ amount: val }),
      setCustomRate: (pair, rate) =>
        set(state => ({
          customRates: { ...state.customRates, [pair]: rate },
        })),
    }),
    {
      name: "converter-store",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
