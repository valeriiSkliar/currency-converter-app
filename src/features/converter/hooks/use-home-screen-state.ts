import * as React from "react";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { useCurrencies } from "../api/use-rates";
import { useConverterStore } from "../store/use-converter-store";
import { useQuotaStore } from "../store/use-quota-store";
import { convertCurrency, getExchangeRate } from "../utils/conversion-helpers";
import { useExchangeRates } from "./use-exchange-rates";
import { useNumpadHandlers } from "./use-numpad-handlers";

function formatInputAmount(rawVal: string, locale: string): string {
  if (!rawVal) {
    return "";
  }
  const parts = rawVal.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const num = Number.parseInt(integerPart, 10);
  if (Number.isNaN(num)) {
    return rawVal;
  }

  const formattedInteger = num.toLocaleString(locale, { maximumFractionDigits: 0 });

  if (integerPart === "-" || integerPart === "") {
    return rawVal;
  }

  const decimalSeparator = locale === "ru-RU" ? "," : ".";
  if (decimalPart !== undefined) {
    return `${formattedInteger}${decimalSeparator}${decimalPart}`;
  }

  if (rawVal.endsWith(".")) {
    return `${formattedInteger}${decimalSeparator}`;
  }

  return formattedInteger;
}

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

  const formattedAmount = React.useMemo(() => {
    const locale = language === "ru" ? "ru-RU" : "en-US";
    return formatInputAmount(amount, locale);
  }, [amount, language]);

  // Currency info resolver
  const getCurrencyInfo = React.useCallback((code: string) => {
    const found = currenciesData?.find(c => c.code === code);
    if (found) {
      return {
        symbol: found.symbol || code,
        name: found.name || code,
      };
    }
    // API data not yet available — use code as neutral placeholder
    return { symbol: code, name: code };
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
    const isCrypto = currenciesData?.find(c => c.code === code)?.type === "crypto";
    const minDecimals = isCrypto ? 6 : Math.min(decimalPlaces, 2);
    const maxDecimals = isCrypto ? 8 : decimalPlaces;
    const locale = language === "ru" ? "ru-RU" : "en-US";
    return converted.toLocaleString(locale, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
  }, [amount, baseCurrency, rates, customRates, decimalPlaces, language, currenciesData]);

  const getRateText = React.useCallback((code: string) => {
    const rate = getExchangeRate({
      from: baseCurrency,
      to: code,
      rates,
      customRates,
    });
    const locale = language === "ru" ? "ru-RU" : "en-US";
    const isCrypto = currenciesData?.find(c => c.code === code)?.type === "crypto";
    const d = isCrypto
      ? 8
      : rate >= 1000
        ? 0
        : rate >= 1
          ? Math.min(4, decimalPlaces)
          : Math.min(6, Math.max(4, decimalPlaces));
    return rate.toLocaleString(locale, {
      maximumFractionDigits: d,
    });
  }, [baseCurrency, rates, customRates, decimalPlaces, language, currenciesData]);

  return {
    baseCurrency,
    targetCurrencies,
    amount,
    formattedAmount,
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
