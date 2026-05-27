import * as React from "react";
import { Animated, Text, View } from "react-native";

type AmountDisplayProps = {
  value: string;
  symbol: string;
  focused?: boolean;
};

export function AmountDisplay({ value, symbol, focused = false }: AmountDisplayProps) {
  const display = value || "0";
  const len = display.length;

  let size = 40;
  if (len > 8)
    size = 34;
  if (len > 11)
    size = 28;
  if (len > 14)
    size = 22;

  return (
    <View className="min-h-[48px] flex-row items-baseline gap-1.5">
      {/* Symbol */}
      <Text
        className="font-extrabold text-ink/55"
        style={{ fontSize: size * 0.65 }}
      >
        {symbol}
      </Text>

      {/* Value */}
      <Text
        className="font-extrabold text-ink"
        style={{
          fontSize: size,
          fontVariant: ["tabular-nums"],
          letterSpacing: -1,
        }}
      >
        {display}
      </Text>

      {/* Blinking Caret */}
      {focused && <BlinkingCaret size={size} />}
    </View>
  );
}

function BlinkingCaret({ size }: { size: number }) {
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: 2,
        height: size * 0.85,
        backgroundColor: "currentColor",
        opacity,
        marginLeft: 2,
        alignSelf: "center",
      }}
      className="text-ink"
    />
  );
}
