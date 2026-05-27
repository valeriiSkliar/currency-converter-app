import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { FlagIcon } from "@/components/flag-icon";
import { CameraIcon, EditIcon } from "@/components/ui/icons";
import { AmountDisplay } from "./amount-display";

type BaseCardProps = {
  baseCurrency: string;
  symbol: string;
  amount: string;
  onScan: () => void;
  onEditBase: () => void;
};

export function BaseCard({
  baseCurrency,
  symbol,
  amount,
  onScan,
  onEditBase,
}: BaseCardProps) {
  const { t } = useTranslation();

  return (
    <View
      className="relative rounded-[24px] border border-line bg-surface px-[18px] py-3.5"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left Side: Amount Display */}
        <View className="flex-1 pr-4">
          <AmountDisplay value={amount} symbol={symbol} focused={true} />
        </View>

        {/* Right Side: Currency Pill */}
        <View
          className="flex-row items-center gap-2 rounded-full border border-line bg-chip py-1.5 pr-3.5 pl-1.5"
        >
          <FlagIcon code={baseCurrency} size={30} />

          <Text className="text-center text-[15px] font-extrabold tracking-tight text-ink">
            {baseCurrency}
          </Text>

          {/* Edit/Custom Rate button */}
          <Pressable
            onPress={onEditBase}
            className="rounded-full p-1 active:bg-black/10 dark:active:bg-white/10"
            accessibilityLabel="Edit rate"
          >
            <EditIcon color="var(--color-ink-mute)" size={16} />
          </Pressable>
        </View>
      </View>

      {/* Peeking camera SCAN tab - pinned to the right edge */}
      <Pressable
        onPress={onScan}
        className="absolute top-1/2 -right-3 h-14 w-16 -translate-y-1/2 flex-col items-center justify-center rounded-l-[18px] rounded-r-[4px] bg-ink active:opacity-90"
        style={{
          shadowColor: "#0e0e10",
          shadowOffset: { width: -4, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
          transform: [{ translateY: 8 }], // visual offset matching prototype
        }}
        accessibilityLabel={t("converter.scan")}
      >
        <View className="flex-col items-center justify-center pr-2">
          <CameraIcon color="var(--color-bg)" size={20} />
          <Text className="mt-0.5 text-[9px] font-extrabold tracking-widest text-bg uppercase">
            {t("converter.scan")}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
