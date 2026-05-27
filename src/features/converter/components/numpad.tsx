import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { BackspaceIcon, CheckIcon } from "@/components/ui/icons";

type NumpadProps = {
  onTapDigit: (digit: string) => void;
  onTapDot: () => void;
  onTapBackspace: () => void;
  onTapClear: () => void;
  onTapOperator: (op: string) => void;
  onTapDone: () => void;
};

export function Numpad({
  onTapDigit,
  onTapDot,
  onTapBackspace,
  onTapClear,
  onTapOperator,
  onTapDone,
}: NumpadProps) {
  return (
    <View className="min-h-[300px] w-full flex-row gap-2">
      {/* Left Column Component */}
      <LeftColumn
        onTapClear={onTapClear}
        onTapOperator={onTapOperator}
        onTapDone={onTapDone}
      />

      {/* Right Section: 3x4 Digits & Backspace Grid */}
      <View className="flex-3 gap-2">
        {/* Row 1: 7, 8, 9 */}
        <View className="flex-1 flex-row gap-2">
          <NumpadDigit digit="7" onPress={onTapDigit} />
          <NumpadDigit digit="8" onPress={onTapDigit} />
          <NumpadDigit digit="9" onPress={onTapDigit} />
        </View>

        {/* Row 2: 4, 5, 6 */}
        <View className="flex-1 flex-row gap-2">
          <NumpadDigit digit="4" onPress={onTapDigit} />
          <NumpadDigit digit="5" onPress={onTapDigit} />
          <NumpadDigit digit="6" onPress={onTapDigit} />
        </View>

        {/* Row 3: 1, 2, 3 */}
        <View className="flex-1 flex-row gap-2">
          <NumpadDigit digit="1" onPress={onTapDigit} />
          <NumpadDigit digit="2" onPress={onTapDigit} />
          <NumpadDigit digit="3" onPress={onTapDigit} />
        </View>

        {/* Row 4: 0, Comma, Backspace */}
        <View className="flex-1 flex-row gap-2">
          <NumpadDigit digit="0" onPress={onTapDigit} />

          {/* Comma/Dot */}
          <Pressable
            onPress={onTapDot}
            className="flex-1 items-center justify-center rounded-[18px] border border-line bg-surface active:bg-black/5 dark:active:bg-white/5"
          >
            <Text className="text-3xl leading-none font-extrabold text-ink">,</Text>
          </Pressable>

          {/* Backspace */}
          <Pressable
            onPress={onTapBackspace}
            className="flex-1 items-center justify-center rounded-[18px] bg-chip active:bg-black/10 dark:active:bg-white/10"
            accessibilityLabel="Backspace"
          >
            <BackspaceIcon color="var(--color-ink)" size={22} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type LeftColumnProps = {
  onTapClear: () => void;
  onTapOperator: (op: string) => void;
  onTapDone: () => void;
};

function LeftColumn({ onTapClear, onTapOperator, onTapDone }: LeftColumnProps) {
  return (
    <View style={{ flex: 1.4 }} className="gap-2">
      {/* Clear Button */}
      <Pressable
        onPress={onTapClear}
        className="flex-1 items-center justify-center rounded-[18px] bg-chip active:bg-black/10 dark:active:bg-white/10"
        accessibilityLabel="Clear"
      >
        <Text className="text-[22px] font-bold text-ink-mute">C</Text>
      </Pressable>

      {/* 2x2 Operator Quadrant */}
      <View className="flex-2 justify-between rounded-[18px] bg-accent p-2.5">
        {/* Row 1 */}
        <View className="flex-1 flex-row items-center justify-between">
          <Pressable
            onPress={() => onTapOperator("+")}
            className="flex-1 items-center justify-center py-2 active:opacity-60"
          >
            <Text className="text-2xl font-black text-accent-ink">+</Text>
          </Pressable>
          <Pressable
            onPress={() => onTapOperator("-")}
            className="flex-1 items-center justify-center py-2 active:opacity-60"
          >
            <Text className="text-2xl font-black text-accent-ink">−</Text>
          </Pressable>
        </View>

        {/* Row 2 */}
        <View className="flex-1 flex-row items-center justify-between">
          <Pressable
            onPress={() => onTapOperator("*")}
            className="flex-1 items-center justify-center py-2 active:opacity-60"
          >
            <Text className="text-2xl font-black text-accent-ink">×</Text>
          </Pressable>
          <Pressable
            onPress={() => onTapOperator("/")}
            className="flex-1 items-center justify-center py-2 active:opacity-60"
          >
            <Text className="text-2xl font-black text-accent-ink">÷</Text>
          </Pressable>
        </View>
      </View>

      {/* Done Button */}
      <Pressable
        onPress={onTapDone}
        className="flex-1 items-center justify-center rounded-[18px] bg-ink active:opacity-85"
        accessibilityLabel="Done"
      >
        <CheckIcon color="var(--color-bg)" size={22} />
      </Pressable>
    </View>
  );
}

type NumpadDigitProps = {
  digit: string;
  onPress: (digit: string) => void;
};

function NumpadDigit({ digit, onPress }: NumpadDigitProps) {
  return (
    <Pressable
      onPress={() => onPress(digit)}
      className="flex-1 items-center justify-center rounded-[18px] border border-line bg-surface active:bg-black/5 dark:active:bg-white/5"
    >
      <Text
        className="text-[26px] font-bold text-ink"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {digit}
      </Text>
    </Pressable>
  );
}
