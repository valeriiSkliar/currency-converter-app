import * as React from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { useCryptoRates, useCurrencies, useFiatRates } from "../api/use-rates";
import { useConverterStore } from "../store/use-converter-store";

export type CurrencyPickerTab = "all" | "fiat" | "crypto";

export type CurrencyGroup = {
  type: string;
  label: string;
  items: any[];
  totalLabel: string;
};

const FALLBACK_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", type: "fiat", flag_emoji: "🇺🇸", sort_order: 1 },
  { code: "EUR", name: "Euro", symbol: "€", type: "fiat", flag_emoji: "🇪🇺", sort_order: 2 },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", type: "fiat", flag_emoji: "🇷🇺", sort_order: 3 },
  { code: "GBP", name: "British Pound", symbol: "£", type: "fiat", flag_emoji: "🇬🇧", sort_order: 4 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", type: "fiat", flag_emoji: "🇯🇵", sort_order: 5 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", type: "fiat", flag_emoji: "🇨🇳", sort_order: 6 },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", type: "fiat", flag_emoji: "🇨🇭", sort_order: 7 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", type: "fiat", flag_emoji: "🇨🇦", sort_order: 8 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", type: "fiat", flag_emoji: "🇦🇺", sort_order: 9 },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", type: "fiat", flag_emoji: "🇳🇿", sort_order: 10 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", type: "fiat", flag_emoji: "🇮🇳", sort_order: 11 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", type: "fiat", flag_emoji: "🇰🇷", sort_order: 12 },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", type: "fiat", flag_emoji: "🇹🇷", sort_order: 13 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", type: "fiat", flag_emoji: "🇧🇷", sort_order: 14 },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", type: "fiat", flag_emoji: "🇲🇽", sort_order: 15 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", type: "fiat", flag_emoji: "🇸🇪", sort_order: 16 },
  { code: "PLN", name: "Polish Złoty", symbol: "zł", type: "fiat", flag_emoji: "🇵🇱", sort_order: 17 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", type: "fiat", flag_emoji: "🇦🇪", sort_order: 18 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", type: "fiat", flag_emoji: "🇸🇬", sort_order: 19 },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", type: "fiat", flag_emoji: "🇭🇰", sort_order: 20 },
  { code: "BTC", name: "Bitcoin", symbol: "₿", type: "crypto", flag_emoji: "₿", sort_order: 21 },
  { code: "ETH", name: "Ethereum", symbol: "Ξ", type: "crypto", flag_emoji: "Ξ", sort_order: 22 },
  { code: "USDT", name: "Tether", symbol: "₮", type: "crypto", flag_emoji: "₮", sort_order: 23 },
  { code: "BNB", name: "BNB", symbol: "BNB", type: "crypto", flag_emoji: "B", sort_order: 24 },
  { code: "SOL", name: "Solana", symbol: "◎", type: "crypto", flag_emoji: "◎", sort_order: 25 },
  { code: "XRP", name: "XRP", symbol: "XRP", type: "crypto", flag_emoji: "X", sort_order: 26 },
  { code: "ADA", name: "Cardano", symbol: "₳", type: "crypto", flag_emoji: "₳", sort_order: 27 },
  { code: "DOGE", name: "Dogecoin", symbol: "Ð", type: "crypto", flag_emoji: "Ð", sort_order: 28 },
];

export function useCurrencyPickerState() {
  const { t } = useTranslation();
  const { language } = useSettingsStore();

  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<CurrencyPickerTab>("all");

  const { baseCurrency, targetCurrencies } = useConverterStore();

  // API Queries
  const { data: currenciesData, isLoading: isLoadingCurrencies } = useCurrencies();
  const { data: fiatRatesData, isLoading: isLoadingFiat } = useFiatRates();
  const { data: cryptoRatesData, isLoading: isLoadingCrypto } = useCryptoRates();

  // Combine rates relative to USD
  const rates = React.useMemo(() => {
    const map: Record<string, number> = { USD: 1 };
    if (fiatRatesData?.rates) {
      Object.assign(map, fiatRatesData.rates);
    }
    if (cryptoRatesData?.rates) {
      Object.assign(map, cryptoRatesData.rates);
    }
    return map;
  }, [fiatRatesData, cryptoRatesData]);

  // Exclude codes check
  const isTaken = React.useCallback(
    (code: string) => {
      const upper = code.toUpperCase();
      return upper === baseCurrency.toUpperCase() || targetCurrencies.includes(upper);
    },
    [baseCurrency, targetCurrencies],
  );

  // Filter list
  const list = React.useMemo(() => {
    const activeData = currenciesData && currenciesData.length > 0 ? currenciesData : FALLBACK_CURRENCIES;
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
    isLoading: isLoadingCurrencies || isLoadingFiat || isLoadingCrypto,
  };
}
