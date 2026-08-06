import * as React from "react";
import { useCryptoRates, useFiatRates } from "../api/use-rates";

type RatesMap = Record<string, number>;

export function useExchangeRates() {
  const { data: fiatRatesData, refetch: refetchFiat, isFetching: isFetchingFiat } = useFiatRates();
  const { data: cryptoRatesData, refetch: refetchCrypto, isFetching: isFetchingCrypto } = useCryptoRates();

  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false);

  const rates = React.useMemo(() => {
    const map: RatesMap = { USD: 1 };
    if (fiatRatesData?.rates) {
      Object.assign(map, fiatRatesData.rates);
    }
    if (cryptoRatesData?.rates) {
      for (const [code, priceInUsd] of Object.entries(cryptoRatesData.rates)) {
        if (typeof priceInUsd === "number" && priceInUsd > 0) {
          map[code] = 1 / priceInUsd;
        }
      }
    }
    return map;
  }, [fiatRatesData, cryptoRatesData]);

  const updatedAt = React.useMemo(() => {
    const fiatTime = fiatRatesData?.fetched_at ? new Date(fiatRatesData.fetched_at).getTime() : null;
    const cryptoTime = cryptoRatesData?.fetched_at ? new Date(cryptoRatesData.fetched_at).getTime() : null;
    if (fiatTime && cryptoTime) {
      return Math.max(fiatTime, cryptoTime);
    }
    return fiatTime || cryptoTime || null;
  }, [fiatRatesData, cryptoRatesData]);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchFiat(), refetchCrypto()]);
    }
    catch {
      // Ignored
    }
    finally {
      setIsManualRefreshing(false);
    }
  };

  return {
    rates,
    updatedAt,
    isRefreshing: isFetchingFiat || isFetchingCrypto || isManualRefreshing,
    handleRefresh,
  };
}
