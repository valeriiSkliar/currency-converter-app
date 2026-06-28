import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BackspaceIcon, CheckIcon } from "@/components/ui/icons";
import { useThemeColors } from "@/components/ui/use-theme-colors";

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
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      {/* Left Column Component */}
      <LeftColumn
        onTapClear={onTapClear}
        onTapOperator={onTapOperator}
        onTapDone={onTapDone}
      />

      {/* Right Section: 3x4 Digits & Backspace Grid */}
      <View style={styles.digitsPanel}>
        {/* Row 1: 7, 8, 9 */}
        <View style={styles.digitRow}>
          <NumpadDigit digit="7" onPress={onTapDigit} />
          <NumpadDigit digit="8" onPress={onTapDigit} />
          <NumpadDigit digit="9" onPress={onTapDigit} />
        </View>

        {/* Row 2: 4, 5, 6 */}
        <View style={styles.digitRow}>
          <NumpadDigit digit="4" onPress={onTapDigit} />
          <NumpadDigit digit="5" onPress={onTapDigit} />
          <NumpadDigit digit="6" onPress={onTapDigit} />
        </View>

        {/* Row 3: 1, 2, 3 */}
        <View style={styles.digitRow}>
          <NumpadDigit digit="1" onPress={onTapDigit} />
          <NumpadDigit digit="2" onPress={onTapDigit} />
          <NumpadDigit digit="3" onPress={onTapDigit} />
        </View>

        {/* Row 4: 0, Comma, Backspace */}
        <View style={styles.digitRow}>
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
            accessibilityLabel={t("converter.backspace")}
          >
            <BackspaceIcon color={colors.ink} size={22} />
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
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1.4 }} className="gap-2">
      {/* Clear Button */}
      <Pressable
        onPress={onTapClear}
        className="flex-1 items-center justify-center rounded-[18px] bg-chip active:bg-black/10 dark:active:bg-white/10"
        accessibilityLabel={t("converter.clear")}
      >
        <Text className="text-[22px] font-bold text-ink-mute">C</Text>
      </Pressable>

      {/* 2x2 Operator Quadrant */}
      <View style={styles.operatorPad} className="justify-between rounded-[18px] bg-accent p-2.5">
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
        accessibilityLabel={t("converter.done")}
      >
        <CheckIcon color={colors.bg} size={22} />
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

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexShrink: 1,
    gap: 8,
    minHeight: 240,
    width: "100%",
  },
  digitRow: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  digitsPanel: {
    flex: 3,
    gap: 8,
  },
  operatorPad: {
    flex: 2,
  },
});
