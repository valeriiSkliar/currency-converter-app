import * as React from "react";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { useCurrencies } from "../api/use-rates";
import { useConverterStore } from "../store/use-converter-store";
import { useQuotaStore } from "../store/use-quota-store";
import { convertCurrency, getExchangeRate } from "../utils/conversion-helpers";
import { useExchangeRates } from "./use-exchange-rates";
import { useNumpadHandlers } from "./use-numpad-handlers";

export function useHomeScreenState() {
  // Stores
  const { decimalPlaces, language } = useSettingsStore();
  const isPro = useQuotaStore(state => state.isPro);
  const {
    baseCurrency,
    targetCurrencies,
    amount,
    customRates,
    updateAmount,
    swapBaseWithRow,
    removeCurrency,
  } = useConverterStore();

  // API Queries & Combined Rates
  const { data: currenciesData } = useCurrencies();
  const { rates, updatedAt, isRefreshing, handleRefresh } = useExchangeRates();

  // Numpad key triggers delegation
  const numpadHandlers = useNumpadHandlers(amount, updateAmount);

  // Currency info resolver
  const getCurrencyInfo = React.useCallback((code: string) => {
    const found = currenciesData?.find(c => c.code === code);
    if (found) {
      return {
        symbol: found.symbol || code,
        name: found.name || code,
      };
    }
    const fallbacks: Record<string, { symbol: string; name: string }> = {
      USD: { symbol: "$", name: "US Dollar" },
      EUR: { symbol: "€", name: "Euro" },
      RUB: { symbol: "₽", name: "Russian Ruble" },
      GBP: { symbol: "£", name: "British Pound" },
      JPY: { symbol: "¥", name: "Japanese Yen" },
      CNY: { symbol: "¥", name: "Chinese Yuan" },
      CHF: { symbol: "Fr", name: "Swiss Franc" },
      CAD: { symbol: "C$", name: "Canadian Dollar" },
      AUD: { symbol: "A$", name: "Australian Dollar" },
      NZD: { symbol: "NZ$", name: "New Zealand Dollar" },
      BTC: { symbol: "₿", name: "Bitcoin" },
      ETH: { symbol: "Ξ", name: "Ethereum" },
      USDT: { symbol: "₮", name: "Tether" },
    };
    return fallbacks[code] || { symbol: code, name: code };
  }, [currenciesData]);

  // Conversions
  const getConvertedText = React.useCallback((code: string) => {
    const converted = convertCurrency({
      amountStr: amount,
      from: baseCurrency,
      to: code,
      rates,
      customRates,
    });
    const locale = language === "ru" ? "ru-RU" : "en-US";
    return converted.toLocaleString(locale, {
      minimumFractionDigits: Math.min(decimalPlaces, 2),
      maximumFractionDigits: decimalPlaces,
    });
  }, [amount, baseCurrency, rates, customRates, decimalPlaces, language]);

  const getRateText = React.useCallback((code: string) => {
    const rate = getExchangeRate({
      from: baseCurrency,
      to: code,
      rates,
      customRates,
    });
    const locale = language === "ru" ? "ru-RU" : "en-US";
    const d = rate >= 1000
      ? 0
      : rate >= 1
        ? Math.min(4, decimalPlaces)
        : Math.min(6, Math.max(4, decimalPlaces));
    return rate.toLocaleString(locale, {
      maximumFractionDigits: d,
    });
  }, [baseCurrency, rates, customRates, decimalPlaces, language]);

  return {
    baseCurrency,
    targetCurrencies,
    amount,
    isPro,
    updatedAt,
    isRefreshing,
    getCurrencyInfo,
    getConvertedText,
    getRateText,
    handleRefresh,
    swapBaseWithRow,
    removeCurrency,
    ...numpadHandlers,
  };
}
