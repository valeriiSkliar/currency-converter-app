import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ScreenBackground } from "@/components/ui";
import { evaluate, useCalculatorEngine } from "@/features/converter/hooks/use-calculator-engine";
import { useConverterStore } from "@/features/converter/store/use-converter-store";

export default function CalculatorScreen() {
  const router = useRouter();
  const { operator } = useLocalSearchParams<{ operator?: string }>();

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
            <BackIcon className="text-ink" />
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
    <View className="flex-1 gap-2.5 pb-4">
      {/* Row 1 */}
      <View className="flex-1 flex-row gap-2.5">
        <CalcKey kind="clear" onPress={() => pressKey("C")}>C</CalcKey>
        <CalcKey kind="op" onPress={() => pressKey("%")}>%</CalcKey>
        <CalcKey kind="op" onPress={() => pressKey("±")}>±</CalcKey>
        <CalcKey kind="op" active={operation === "/"} onPress={() => pressKey("/")}>÷</CalcKey>
      </View>

      {/* Row 2 */}
      <View className="flex-1 flex-row gap-2.5">
        <CalcKey onPress={() => pressKey("7")}>7</CalcKey>
        <CalcKey onPress={() => pressKey("8")}>8</CalcKey>
        <CalcKey onPress={() => pressKey("9")}>9</CalcKey>
        <CalcKey kind="op" active={operation === "*"} onPress={() => pressKey("*")}>×</CalcKey>
      </View>

      {/* Row 3 */}
      <View className="flex-1 flex-row gap-2.5">
        <CalcKey onPress={() => pressKey("4")}>4</CalcKey>
        <CalcKey onPress={() => pressKey("5")}>5</CalcKey>
        <CalcKey onPress={() => pressKey("6")}>6</CalcKey>
        <CalcKey kind="op" active={operation === "-"} onPress={() => pressKey("-")}>−</CalcKey>
      </View>

      {/* Row 4 */}
      <View className="flex-1 flex-row gap-2.5">
        <CalcKey onPress={() => pressKey("1")}>1</CalcKey>
        <CalcKey onPress={() => pressKey("2")}>2</CalcKey>
        <CalcKey onPress={() => pressKey("3")}>3</CalcKey>
        <CalcKey kind="op" active={operation === "+"} onPress={() => pressKey("+")}>+</CalcKey>
      </View>

      {/* Row 5 */}
      <View className="flex-1 flex-row gap-2.5">
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
  let btnStyle = "flex-1 h-full items-center justify-center rounded-2xl active:opacity-75 ";
  let textStyle = "font-variant-numeric-tabular-nums tracking-tighter ";

  if (kind === "clear") {
    btnStyle += "bg-[#FCEDEE] border border-[rgba(215,38,61,0.18)] dark:bg-[#3B1519] dark:border-[rgba(239,68,68,0.2)]";
    textStyle += "text-[#D7263D] dark:text-[#FF8E99] font-extrabold text-3xl";
  }
  else if (kind === "op") {
    btnStyle += active ? "bg-ink border border-transparent" : "bg-surface border border-line";
    textStyle += active ? "text-surface font-bold text-3xl" : "text-ink-mute font-bold text-3xl";
  }
  else if (kind === "backspace") {
    btnStyle += "bg-ink border border-transparent";
  }
  else if (kind === "apply") {
    btnStyle += "bg-[#FFE9D6] border border-[rgba(230,120,34,0.18)] dark:bg-[#3D2513] dark:border-[rgba(230,120,34,0.3)]";
    textStyle += "text-[#E67822] dark:text-[#FFA052] font-black text-2xl";
  }
  else {
    btnStyle += "bg-surface border border-line";
    textStyle += "text-ink font-bold text-2xl";
  }

  return (
    <Pressable onPress={onPress} className={btnStyle}>
      {kind === "backspace"
        ? (
            <BackspaceIcon className="text-surface" />
          )
        : (
            <Text className={textStyle}>{children}</Text>
          )}
    </Pressable>
  );
}

function BackIcon({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BackspaceIcon({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M9 5h10a2 2 0 012 2v10a2 2 0 01-2 2H9l-6-7 6-7z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M13 9l4 6m0-6l-4 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
