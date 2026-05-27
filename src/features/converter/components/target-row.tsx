import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { FlagIcon } from "@/components/flag-icon";
import { CloseIcon } from "@/components/ui/icons";

type TargetRowProps = {
  code: string;
  symbol: string;
  baseCurrency: string;
  rateText: string;
  convertedText: string;
  onPromote: () => void;
  onRemove: () => void;
  divider?: boolean;
};

export function TargetRow({
  code,
  symbol,
  baseCurrency,
  rateText,
  convertedText,
  onPromote,
  onRemove,
  divider = false,
}: TargetRowProps) {
  return (
    <View
      className={`flex-row items-center gap-3 px-3.5 py-3 ${
        divider ? "border-b border-line" : ""
      }`}
    >
      {/* Tap Area to Swap Base Currency */}
      <Pressable
        onPress={onPromote}
        className="flex-1 flex-row items-center gap-3 active:opacity-70"
      >
        <FlagIcon code={code} size={38} />

        {/* Code & Rate */}
        <View className="flex-1 justify-center leading-tight">
          <Text className="text-[15px] font-extrabold tracking-tight text-ink">
            {code}
          </Text>
          <Text className="mt-0.5 text-[11px] font-medium text-ink-mute">
            1
            {" "}
            {baseCurrency}
            {" "}
            =
            {" "}
            <Text className="font-semibold text-ink-mute">{rateText}</Text>
          </Text>
        </View>

        {/* Converted Amount */}
        <View className="flex-row items-baseline gap-1 self-center pr-2">
          <Text className="text-xs font-bold text-ink/55">{symbol}</Text>
          <Text
            className="text-lg font-extrabold text-ink"
            style={{ fontVariant: ["tabular-nums"], letterSpacing: -0.5 }}
          >
            {convertedText}
          </Text>
        </View>
      </Pressable>

      {/* Delete/Remove button */}
      <Pressable
        onPress={onRemove}
        className="size-[26px] items-center justify-center rounded-full border border-line bg-chip active:bg-black/10 dark:active:bg-white/10"
        accessibilityLabel={`Remove ${code}`}
      >
        <CloseIcon color="var(--color-ink-mute)" size={12} />
      </Pressable>
    </View>
  );
}
