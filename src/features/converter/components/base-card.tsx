import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { FlagIcon } from "@/components/flag-icon";
import { EditIcon } from "@/components/ui/icons";
import { useThemeColors } from "@/components/ui/use-theme-colors";
import { AmountDisplay } from "./amount-display";

type BaseCardProps = {
  baseCurrency: string;
  symbol: string;
  amount: string;
  onEditBase: () => void;
};

export function BaseCard({
  baseCurrency,
  symbol,
  amount,
  onEditBase,
}: BaseCardProps) {
  const colors = useThemeColors();

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
            <EditIcon color={colors.inkMute} size={16} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
