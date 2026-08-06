import * as React from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { useCurrencies } from "../api/use-rates";
import { useConverterStore } from "../store/use-converter-store";
import { useExchangeRates } from "./use-exchange-rates";

export type CurrencyPickerTab = "all" | "fiat" | "crypto";

export type CurrencyGroup = {
  type: string;
  label: string;
  items: any[];
  totalLabel: string;
};

export function useCurrencyPickerState() {
  const { t } = useTranslation();
  const { language } = useSettingsStore();

  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<CurrencyPickerTab>("all");

  const { baseCurrency, targetCurrencies } = useConverterStore();

  // API Queries
  const { data: currenciesData, isLoading: isLoadingCurrencies, isError: isErrorCurrencies } = useCurrencies();
  const { rates, isRefreshing: isLoadingRates } = useExchangeRates();

  // Exclude codes check
  const isTaken = React.useCallback(
    (code: string) => {
      const upper = code.toUpperCase();
      return upper === baseCurrency.toUpperCase() || targetCurrencies.includes(upper);
    },
    [baseCurrency, targetCurrencies],
  );

  // Filter list — use empty array until data arrives from API
  const list = React.useMemo(() => {
    const activeData = currenciesData ?? [];
    let result = activeData;
    if (tab !== "all") {
      result = result.filter(c => c.type === tab);
    }
    if (q.trim()) {
      const query = q.toLowerCase();
      result = result.filter(
        c => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query),
      );
    }
    return result;
  }, [currenciesData, tab, q]);

  // Group by category
  const groups = React.useMemo<CurrencyGroup[]>(() => {
    if (tab !== "all") {
      const label = tab === "fiat" ? t("converter.fiat") : t("converter.crypto");
      const totalLabel = tab === "fiat" ? "150+" : "15";
      return [{ type: tab, label, items: list, totalLabel }];
    }

    return [
      {
        type: "fiat",
        label: t("converter.fiat"),
        items: list.filter(c => c.type === "fiat"),
        totalLabel: "150+",
      },
      {
        type: "crypto",
        label: t("converter.crypto"),
        items: list.filter(c => c.type === "crypto"),
        totalLabel: "15",
      },
    ];
  }, [list, tab, t]);

  const getFormattedRate = React.useCallback(
    (code: string) => {
      const rate = rates[code] || 0;
      if (!Number.isFinite(rate) || rate === 0) {
        return "—";
      }
      const locale = language === "ru" ? "ru-RU" : "en-US";
      const d = rate >= 1000 ? 0 : rate >= 1 ? 4 : 6;
      return rate.toLocaleString(locale, {
        maximumFractionDigits: d,
      });
    },
    [rates, language],
  );

  return {
    q,
    setQ,
    tab,
    setTab,
    groups,
    isTaken,
    getFormattedRate,
    isLoading: isLoadingCurrencies || isLoadingRates,
    isError: isErrorCurrencies,
  };
}
