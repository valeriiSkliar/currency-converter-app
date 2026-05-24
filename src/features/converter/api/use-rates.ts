import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api";

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  type: "fiat" | "crypto";
  flag_emoji: string;
  is_active: boolean;
  sort_order: number;
};

export type RatesEnvelope = {
  base: string;
  provider: string;
  fetched_at: string | null;
  rates: Record<string, number>;
};

export type RatesStatus = {
  fiat_updated_at: string | null;
  crypto_updated_at: string | null;
};

/**
 * Fetch all active currencies sorted by sort order and code.
 */
export function useCurrencies() {
  return useQuery<Currency[]>({
    queryKey: ["currencies"],
    queryFn: async () => {
      const response = await client.get<{ data: Currency[] }>("/currencies");
      return response.data.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour stale time
  });
}

/**
 * Fetch latest fiat exchange rates relative to USD.
 */
export function useFiatRates() {
  return useQuery<RatesEnvelope>({
    queryKey: ["rates", "fiat"],
    queryFn: async () => {
      const response = await client.get<{ data: RatesEnvelope }>("/rates/fiat");
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
}

/**
 * Fetch latest crypto rates relative to USD.
 * Auto-refetches every 60 seconds.
 */
export function useCryptoRates() {
  return useQuery<RatesEnvelope>({
    queryKey: ["rates", "crypto"],
    queryFn: async () => {
      const response = await client.get<{ data: RatesEnvelope }>(
        "/rates/crypto",
      );
      return response.data.data;
    },
    staleTime: 1000 * 30, // 30 seconds stale time
    refetchInterval: 1000 * 60, // Poll every minute
  });
}

/**
 * Fetch rates updates status.
 * Auto-refetches every 60 seconds.
 */
export function useRatesStatus() {
  return useQuery<RatesStatus>({
    queryKey: ["rates", "status"],
    queryFn: async () => {
      const response = await client.get<{ data: RatesStatus }>("/rates/status");
      return response.data.data;
    },
    staleTime: 1000 * 30, // 30 seconds stale time
    refetchInterval: 1000 * 60, // Poll every minute
  });
}
