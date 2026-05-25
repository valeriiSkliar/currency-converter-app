import * as React from "react";
import { View } from "react-native";
import { Image } from "@/components/ui/image";

type FlagIconProps = {
  code: string;
  url?: string;
  size?: number;
};

const CRYPTO_CURRENCIES = [
  "BTC",
  "ETH",
  "USDT",
  "USDC",
  "SOL",
  "BNB",
  "XRP",
  "ADA",
  "DOT",
  "DOGE",
  "LTC",
  "LINK",
  "UNI",
  "BCH",
  "AVAX",
  "XLM",
  "TRX",
  "DAI",
  "WBTC",
  "ATOM",
];

function getFlagUrl(code: string, url?: string): string {
  if (url) {
    return url;
  }

  const upperCode = code.toUpperCase();

  // Special Fiat mapping
  if (upperCode === "EUR") {
    return "https://flagcdn.com/w80/eu.png";
  }

  // Crypto mapping
  if (CRYPTO_CURRENCIES.includes(upperCode)) {
    return `https://assets.coincap.io/assets/icons/${upperCode.toLowerCase()}@2x.png`;
  }

  // Default Fiat mapping: first 2 characters of currency code
  const countryCode = upperCode.substring(0, 2).toLowerCase();
  return `https://flagcdn.com/w80/${countryCode}.png`;
}

export function FlagIcon({ code, url, size = 32 }: FlagIconProps) {
  const flagUrl = getFlagUrl(code, url);

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2"
    >
      <Image
        source={{ uri: flagUrl }}
        style={{ width: size, height: size }}
        placeholder={null}
        contentFit="cover"
      />
    </View>
  );
}
