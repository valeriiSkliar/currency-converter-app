import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import type { TextStyle, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ScreenBackground } from "@/components/ui";
import { useThemeColors } from "@/components/ui/use-theme-colors";
import { evaluate, useCalculatorEngine } from "@/features/converter/hooks/use-calculator-engine";
import { useConverterStore } from "@/features/converter/store/use-converter-store";

export default function CalculatorScreen() {
  const router = useRouter();
  const { operator } = useLocalSearchParams<{ operator?: string }>();
  const colors = useThemeColors();

  const initialAmount = useConverterStore(state => state.amount);
  const baseCurrency = useConverterStore(state => state.baseCurrency);
  const updateAmount = useConverterStore(state => state.updateAmount);

  const { displayValue, expression, pressKey, previousValue, operation }
    = useCalculatorEngine(initialAmount);

  // Apply initial operator on mount if navigated from the Home screen
  React.useEffect(() => {
    if (operator) {
      pressKey(operator as any);
    }
  }, [operator, pressKey]);

  const handleApply = () => {
    if (displayValue === "Error")
      return;

    let finalValue = displayValue;
    if (operation !== null && previousValue !== null) {
      finalValue = evaluate(previousValue, displayValue, operation);
    }

    if (finalValue !== "Error") {
      updateAmount(finalValue);
    }
    router.back();
  };

  const title = baseCurrency ? `Calculator (${baseCurrency})` : "Calculator";

  return (
    <ScreenBackground className="flex-1 bg-bg">
      <View className="flex-1 px-4 pb-4">
        {/* Header Bar */}
        <View className="flex-row items-center pt-2 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 rounded-full border border-line bg-surface p-3 active:opacity-80"
            accessibilityLabel="Go back"
          >
            <BackIcon color={colors.ink} />
          </Pressable>
          <Text className="text-xl font-bold text-ink">{title}</Text>
        </View>

        {/* Display Panel */}
        <View className="mb-4 shrink-0 py-2">
          <View className="items-end justify-center rounded-2xl border border-line bg-chip px-5 py-6">
            <Text className="mb-2 text-sm font-semibold text-ink-mute">
              {expression || " "}
            </Text>
            <Text
              className="font-bold tracking-tight text-ink"
              style={{
                fontSize: displayValue.length > 11 ? 32 : (displayValue.length > 8 ? 40 : 48),
                fontVariant: ["tabular-nums"],
              }}
            >
              {displayValue}
            </Text>
          </View>
        </View>

        {/* Keypad Sub-component */}
        <CalculatorKeypad
          pressKey={pressKey}
          operation={operation}
          handleApply={handleApply}
        />
      </View>
    </ScreenBackground>
  );
}

// Subcomponents & Icons

type CalculatorKeypadProps = {
  pressKey: (key: any) => void;
  operation: string | null;
  handleApply: () => void;
};

function CalculatorKeypad({ pressKey, operation, handleApply }: CalculatorKeypadProps) {
  return (
    <View style={calculatorStyles.keypad}>
      {/* Row 1 */}
      <View style={calculatorStyles.keypadRow}>
        <CalcKey kind="clear" onPress={() => pressKey("C")}>C</CalcKey>
        <CalcKey kind="op" onPress={() => pressKey("%")}>%</CalcKey>
        <CalcKey kind="op" onPress={() => pressKey("±")}>±</CalcKey>
        <CalcKey kind="op" active={operation === "/"} onPress={() => pressKey("/")}>÷</CalcKey>
      </View>

      {/* Row 2 */}
      <View style={calculatorStyles.keypadRow}>
        <CalcKey onPress={() => pressKey("7")}>7</CalcKey>
        <CalcKey onPress={() => pressKey("8")}>8</CalcKey>
        <CalcKey onPress={() => pressKey("9")}>9</CalcKey>
        <CalcKey kind="op" active={operation === "*"} onPress={() => pressKey("*")}>×</CalcKey>
      </View>

      {/* Row 3 */}
      <View style={calculatorStyles.keypadRow}>
        <CalcKey onPress={() => pressKey("4")}>4</CalcKey>
        <CalcKey onPress={() => pressKey("5")}>5</CalcKey>
        <CalcKey onPress={() => pressKey("6")}>6</CalcKey>
        <CalcKey kind="op" active={operation === "-"} onPress={() => pressKey("-")}>−</CalcKey>
      </View>

      {/* Row 4 */}
      <View style={calculatorStyles.keypadRow}>
        <CalcKey onPress={() => pressKey("1")}>1</CalcKey>
        <CalcKey onPress={() => pressKey("2")}>2</CalcKey>
        <CalcKey onPress={() => pressKey("3")}>3</CalcKey>
        <CalcKey kind="op" active={operation === "+"} onPress={() => pressKey("+")}>+</CalcKey>
      </View>

      {/* Row 5 */}
      <View style={calculatorStyles.keypadRow}>
        <CalcKey onPress={() => pressKey("0")}>0</CalcKey>
        <CalcKey onPress={() => pressKey(".")}>.</CalcKey>
        <CalcKey kind="backspace" onPress={() => pressKey("⌫")} />
        <CalcKey kind="apply" onPress={handleApply}>OK</CalcKey>
      </View>
    </View>
  );
}

type CalcKeyProps = {
  children?: React.ReactNode;
  onPress: () => void;
  kind?: "digit" | "op" | "clear" | "backspace" | "apply";
  active?: boolean;
};

function CalcKey({ children, onPress, kind = "digit", active = false }: CalcKeyProps) {
  const colors = useThemeColors();
  const isDark = colors.bg === "#0A0A0C";
  let buttonStyle: Pick<ViewStyle, "backgroundColor" | "borderColor"> = {
    backgroundColor: colors.surface,
    borderColor: colors.line,
  };
  let textColor: string = colors.ink;
  let textSize = 24;
  let textWeight: TextStyle["fontWeight"] = "700";

  if (kind === "clear") {
    buttonStyle = {
      backgroundColor: isDark ? "#3B1519" : "#FCEDEE",
      borderColor: isDark ? "rgba(239,68,68,0.2)" : "rgba(215,38,61,0.18)",
    };
    textColor = isDark ? "#FF8E99" : "#D7263D";
    textSize = 30;
    textWeight = "800";
  }
  else if (kind === "op") {
    buttonStyle = active
      ? { backgroundColor: colors.ink, borderColor: "transparent" }
      : { backgroundColor: colors.surface, borderColor: colors.line };
    textColor = active ? colors.surface : colors.inkMute;
    textSize = 30;
  }
  else if (kind === "backspace") {
    buttonStyle = {
      backgroundColor: colors.ink,
      borderColor: "transparent",
    };
  }
  else if (kind === "apply") {
    buttonStyle = {
      backgroundColor: isDark ? "#3D2513" : "#FFE9D6",
      borderColor: isDark ? "rgba(230,120,34,0.3)" : "rgba(230,120,34,0.18)",
    };
    textColor = isDark ? "#FFA052" : "#E67822";
    textWeight = "900";
  }

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-75"
      style={[calculatorStyles.key, buttonStyle]}
    >
      {kind === "backspace"
        ? (
            <BackspaceIcon color={colors.surface} />
          )
        : (
            <Text
              style={[
                calculatorStyles.keyText,
                { color: textColor, fontSize: textSize, fontWeight: textWeight },
              ]}
            >
              {children}
            </Text>
          )}
    </Pressable>
  );
}

function BackIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BackspaceIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5h10a2 2 0 012 2v10a2 2 0 01-2 2H9l-6-7 6-7z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M13 9l4 6m0-6l-4 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const calculatorStyles = StyleSheet.create({
  key: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
  },
  keypad: {
    flex: 1,
    gap: 10,
    minHeight: 360,
    paddingBottom: 16,
  },
  keypadRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
  },
  keyText: {
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
});
