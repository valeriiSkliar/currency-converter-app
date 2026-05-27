import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const GRADIENTS: Record<string, string[]> = {
  USD: ["#1F3DCF", "#3D86F5", "#7AC6FF"],
  EUR: ["#0F2D8A", "#2E5BD6", "#FFD200"],
  RUB: ["#5C0A0A", "#A1242E", "#E8D7B5"],
  GBP: ["#3B0B6E", "#7A2AC0", "#FF7AD2"],
  JPY: ["#7A0E1F", "#D7263D", "#FFD9DE"],
  CNY: ["#8A1010", "#D72E1F", "#FFCE3C"],
  CHF: ["#7E0F1B", "#D6303C", "#FFE0E2"],
  CAD: ["#7E0F1B", "#E4444F", "#FFB8B8"],
  AUD: ["#0A2A6E", "#2A66C7", "#F5D04B"],
  NZD: ["#0E2257", "#385FB1", "#9FB6E4"],
  INR: ["#7A3D00", "#E07A1A", "#0E7B3B"],
  KRW: ["#0A2C6E", "#2A66C7", "#C73A4A"],
  TRY: ["#5E0E14", "#C22531", "#FFE9EB"],
  BRL: ["#0B3D1A", "#1F8A3E", "#FFD835"],
  MXN: ["#0B3D1A", "#1F8A3E", "#C73A4A"],
  SEK: ["#0A2A6E", "#2A66C7", "#F5D04B"],
  PLN: ["#6E0A0A", "#C72A2A", "#F2E9E0"],
  AED: ["#1B5E20", "#2E7D32", "#C09A3E"],
  SGD: ["#7E0F1B", "#E0444F", "#FFFFFF"],
  HKD: ["#7E0F1B", "#D6303C", "#FFCFCF"],
  BTC: ["#7A2B00", "#E07A1A", "#FFC65C"],
  ETH: ["#2C0A6E", "#5B47C2", "#9FA7FF"],
  USDT: ["#0B4A3F", "#1FA88A", "#7CE0C6"],
  BNB: ["#5E4A00", "#E0B500", "#FFE779"],
  SOL: ["#3A0E5C", "#8B2AC2", "#3DE0C2"],
  XRP: ["#0E1B2E", "#27324A", "#7C8AA8"],
  ADA: ["#0A2658", "#1E5DB8", "#7BAFE8"],
  DOGE: ["#5C4A0A", "#C2A22A", "#F2D866"],
};

const DEFAULT_GRADIENT = ["#475569", "#64748B", "#94A3B8"];

type CurrencyMedallionProps = {
  code: string;
  flag: string;
  size?: number;
};

export function CurrencyMedallion({ code, flag, size = 40 }: CurrencyMedallionProps) {
  const gradient = GRADIENTS[code.toUpperCase()] || DEFAULT_GRADIENT;
  const fontSize = Math.round(size * 0.5);

  return (
    <View
      style={{ width: size, height: size }}
      className="shrink-0 items-center justify-center overflow-hidden rounded-full"
    >
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <LinearGradient id={`medGrad-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradient[0]} />
            <Stop offset="55%" stopColor={gradient[1]} />
            <Stop offset="100%" stopColor={gradient[2]} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#medGrad-${code})`} />
      </Svg>

      <Text
        style={{
          fontSize,
          lineHeight: size,
          textAlign: "center",
        }}
        className="font-extrabold text-white"
      >
        {flag}
      </Text>
    </View>
  );
}
