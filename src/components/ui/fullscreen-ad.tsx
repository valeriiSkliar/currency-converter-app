import * as React from "react";
import { useTranslation } from "react-i18next";
import { Animated, Modal, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Polygon, Rect, Stop } from "react-native-svg";

export type FullscreenAdProps = {
  visible: boolean;
  onClose: () => void;
  autoCloseMs?: number;
};

function useAdCountdown(visible: boolean, autoCloseMs: number, progress: Animated.Value) {
  const [remaining, setRemaining] = React.useState(Math.ceil(autoCloseMs / 1000));

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setRemaining(Math.ceil(autoCloseMs / 1000));
    progress.setValue(1);

    Animated.timing(progress, {
      toValue: 0,
      duration: autoCloseMs,
      useNativeDriver: false,
    }).start();

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((autoCloseMs - (Date.now() - startedAt)) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [visible, autoCloseMs, progress]);

  return remaining;
}

function AdHeader({
  remaining,
  canClose,
  onClose,
}: {
  remaining: number;
  canClose: boolean;
  onClose: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="rounded-sm bg-accent px-2.5 py-0.5">
        <Text className="text-[9.5px] font-black tracking-widest text-[#1A1A1C] uppercase">
          AD
        </Text>
      </View>

      <TouchableOpacity
        disabled={!canClose}
        onPress={onClose}
        activeOpacity={0.7}
        className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${
          canClose
            ? "bg-black/90"
            : "bg-black/55"
        }`}
      >
        {canClose
          ? (
              <>
                <CloseCrossIcon />
                <Text className="text-[11.5px] font-bold text-white">Close</Text>
              </>
            )
          : (
              <Text className="text-[11.5px] font-semibold text-white">
                {`Close in ${remaining}s`}
              </Text>
            )}
      </TouchableOpacity>
    </View>
  );
}

function AdBody({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <>
      <View className="flex-1 px-4.5 pt-1">
        <AdHeroImage />

        <View className="flex-col items-center pt-5 text-center">
          <View
            className="size-14 items-center justify-center rounded-lg bg-[#E84D2C]"
            style={{
              shadowColor: "#E84D2C",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 4,
            }}
          >
            <Text className="text-center text-[9px] leading-[1.05] font-black tracking-wide text-white">
              {t("converter.adInterstitialBrand")}
            </Text>
          </View>

          <Text className="mt-4 max-w-[300px] text-center text-xl font-black tracking-tight text-neutral-800">
            {t("converter.adInterstitialTitle")}
          </Text>

          <Text className="mt-3 max-w-[320px] text-center text-[13.5px] leading-relaxed text-neutral-500">
            {t("converter.adInterstitialText")}
          </Text>
        </View>
      </View>

      <CTAButton label={t("converter.adInterstitialCta")} onPress={onClose} />
    </>
  );
}

export function FullscreenAd({ visible, onClose, autoCloseMs = 5000 }: FullscreenAdProps) {
  const progress = React.useRef(new Animated.Value(1)).current;
  const remaining = useAdCountdown(visible, autoCloseMs, progress);

  if (!visible) {
    return null;
  }

  const canClose = remaining <= 0;
  const widthStyle = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      transparent={false}
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={canClose ? onClose : undefined}
    >
      <View className="flex-1 bg-white pt-10">
        <View className="h-1 w-full bg-neutral-100">
          <Animated.View
            className="h-full bg-linear-to-r from-accent to-[#FFA200]"
            style={{ width: widthStyle }}
          />
        </View>

        <AdHeader remaining={remaining} canClose={canClose} onClose={onClose} />
        <AdBody onClose={onClose} />
      </View>
    </Modal>
  );
}

export function AdHeroImage() {
  return (
    <View className="aspect-4/3 w-full overflow-hidden rounded-md bg-neutral-100">
      <Svg viewBox="0 0 400 300" width="100%" height="100%">
        <Defs>
          <LinearGradient id="adSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#A9C6DE" />
            <Stop offset="100%" stopColor="#E8E0CE" />
          </LinearGradient>
          <LinearGradient id="adStone" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#C9B488" />
            <Stop offset="100%" stopColor="#8E7344" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="400" height="300" fill="url(#adSky)" />
        <Circle cx="320" cy="60" r="40" fill="#FFE2A8" opacity="0.7" />

        <G fill="url(#adStone)">
          <Rect x="40" y="170" width="320" height="120" />
          <Polygon points="40,170 100,110 160,170" />
          <Polygon points="240,170 300,110 360,170" />
          <Rect x="180" y="60" width="40" height="230" />
          <Polygon points="180,60 200,30 220,60" />
          <Rect x="120" y="190" width="25" height="50" rx="12" fill="#6F5A35" />
          <Rect x="255" y="190" width="25" height="50" rx="12" fill="#6F5A35" />
          <Circle cx="200" cy="120" r="14" fill="#6F5A35" />
        </G>

        <G fill="#7B8A98" opacity="0.85">
          <Ellipse cx="80" cy="230" rx="38" ry="44" />
          <Rect x="50" y="240" width="60" height="80" rx="18" />
        </G>
      </Svg>
    </View>
  );
}

function CTAButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View className="px-4 py-3.5">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className="w-full flex-row items-center justify-between rounded-md bg-[#1A1F3D] px-[18px] py-4.5"
        style={{
          shadowColor: "#1A1F3D",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 18,
          elevation: 6,
        }}
      >
        <Text className="text-sm font-bold text-white">
          {label}
        </Text>
        <ChevronRightIcon />
      </TouchableOpacity>
    </View>
  );
}

function CloseCrossIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="19,6.41 17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="8.59,16.59 13.17,12 8.59,7.41 10,6 16,12 10,18"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
