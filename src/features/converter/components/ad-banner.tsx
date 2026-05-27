import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

type AdBannerProps = {
  onRemove: () => void;
};

export function AdBanner({ onRemove }: AdBannerProps) {
  const { t } = useTranslation();

  return (
    <View
      className="relative h-14 flex-row items-center gap-3 overflow-hidden rounded-[14px] border border-dashed border-line-strong bg-surface-2 px-3.5"
    >
      {/* Gradient Ad Icon */}
      <View className="size-9 items-center justify-center overflow-hidden rounded-[10px]">
        <Svg className="absolute inset-0" width="100%" height="100%">
          <Defs>
            <LinearGradient id="adGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#2A66C7" />
              <Stop offset="100%" stopColor="#7AC6FF" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#adGrad)" />
        </Svg>
        <Text className="text-sm font-extrabold text-white">Ad</Text>
      </View>

      {/* Ad Pitch Text */}
      <View className="flex-1 justify-center leading-tight">
        <Text
          className="text-xs font-bold text-ink"
          numberOfLines={1}
        >
          {t("converter.upgrade_pitch")}
        </Text>
        <Text className="mt-0.5 text-[9.5px] font-bold tracking-widest text-ink-soft uppercase">
          {t("converter.ad_label")}
          {" "}
          ·
          {t("converter.ad_label_admob")}
        </Text>
      </View>

      {/* Remove Button */}
      <Pressable
        onPress={onRemove}
        className="rounded-full bg-ink px-3 py-1.5 active:opacity-80"
        accessibilityLabel={t("converter.ad_remove")}
      >
        <Text className="text-[11px] font-extrabold text-bg">
          {t("converter.ad_remove")}
        </Text>
      </Pressable>
    </View>
  );
}
