import * as React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Image } from "@/components/ui/image";
import { Share as ShareIcon } from "./ui/icons/share";
import { Support as SupportIcon } from "./ui/icons/support";

// eslint-disable-next-line perfectionist/sort-imports
const convertoffIcon = require("../../assets/icon Convertoff.png");

type DrawerMenuProps = {
  isPro: boolean;
  enableExchangeRates?: boolean;
  onNavigate: (route: string) => void;
  onShare: () => void;
  onRate: () => void;
  onOpenPrivacy: () => void;
};

export function DrawerMenu({
  isPro,
  enableExchangeRates,
  onNavigate,
  onShare,
  onRate,
  onOpenPrivacy,
}: DrawerMenuProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      className="size-full flex-1 bg-surface"
      style={{ paddingTop: 0, paddingBottom: 0 }}
    >
      <DrawerHeader topInset={insets.top} />
      <View className="px-5 pt-3 pb-1">
        <Text className="text-xs font-semibold text-ink-mute">
          {isPro ? t("drawer.pro_plan") : t("drawer.free_plan")}
        </Text>
      </View>
      <DrawerContent
        enableExchangeRates={enableExchangeRates}
        onNavigate={onNavigate}
        onShare={onShare}
        onRate={onRate}
        onOpenPrivacy={onOpenPrivacy}
      />
    </View>
  );
}

function DrawerHeader({ topInset = 0 }: { topInset?: number }) {
  const { t } = useTranslation();
  return (
    <View
      className="relative w-full overflow-hidden bg-[#0057B7] p-5"
      style={{ paddingTop: topInset + 20, paddingBottom: 20 }}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="drawerHeaderGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#0057B7" />
              <Stop offset="100%" stopColor="#002D62" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#drawerHeaderGrad)" />
        </Svg>
      </View>
      {/* App Logo */}
      <View className="mb-3 size-14 items-center justify-center overflow-hidden rounded-2xl bg-black">
        <Image
          source={convertoffIcon}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
      </View>
      <Text className="text-xl font-bold text-white">
        {t("converter.title")}
      </Text>
    </View>
  );
}

type DrawerContentProps = {
  enableExchangeRates?: boolean;
  onNavigate: (route: string) => void;
  onShare: () => void;
  onRate: () => void;
  onOpenPrivacy: () => void;
};

function DrawerContent({
  enableExchangeRates,
  onNavigate,
  onShare,
  onRate,
  onOpenPrivacy,
}: DrawerContentProps) {
  const { t } = useTranslation();
  return (
    <ScrollView className="flex-1 p-4" bounces={false}>
      {/* Navigation Rows */}
      <View className="space-y-1">
        {/* Exchange Rates */}
        {enableExchangeRates && (
          <TouchableOpacity
            onPress={() => onNavigate("/exchange-rates")}
            activeOpacity={0.7}
            className="flex-row items-center rounded-2xl px-3 py-3.5 active:bg-surface-2"
          >
            <TrendIcon color="#6B7077" />
            <Text className="ml-4 text-sm font-semibold text-ink-2">
              {t("drawer.exchange_rates")}
            </Text>
          </TouchableOpacity>
        )}

        {/* My Rate */}
        <TouchableOpacity
          onPress={() => onNavigate("/my-rate")}
          activeOpacity={0.7}
          className="flex-row items-center rounded-2xl px-3 py-3.5 active:bg-surface-2"
        >
          <PencilIcon color="#6B7077" />
          <Text className="ml-4 text-sm font-semibold text-ink-2">
            {t("drawer.my_rate")}
          </Text>
        </TouchableOpacity>

        {/* Rate app */}
        <TouchableOpacity
          onPress={onRate}
          activeOpacity={0.7}
          className="flex-row items-center rounded-2xl px-3 py-3.5 active:bg-surface-2"
        >
          <SupportIcon color="#6B7077" />
          <Text className="ml-4 text-sm font-semibold text-ink-2">
            {t("drawer.rate_app")}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={onShare}
          activeOpacity={0.7}
          className="flex-row items-center rounded-2xl px-3 py-3.5 active:bg-surface-2"
        >
          <ShareIcon color="#6B7077" />
          <Text className="ml-4 text-sm font-semibold text-ink-2">
            {t("drawer.share")}
          </Text>
        </TouchableOpacity>

        {/* Feedback */}
        <TouchableOpacity
          onPress={() => onNavigate("/send-feedback")}
          activeOpacity={0.7}
          className="flex-row items-center rounded-2xl px-3 py-3.5 active:bg-surface-2"
        >
          <BullseyeIcon color="#6B7077" />
          <Text className="ml-4 text-sm font-semibold text-ink-2">
            {t("drawer.feedback")}
          </Text>
        </TouchableOpacity>

        {/* Privacy */}
        <TouchableOpacity
          onPress={onOpenPrivacy}
          activeOpacity={0.7}
          className="flex-row items-center rounded-2xl px-3 py-3.5 active:bg-surface-2"
        >
          <ShieldIcon color="#6B7077" />
          <Text className="ml-4 text-sm font-semibold text-ink-2">
            {t("drawer.privacy")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function TrendIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 12h-4l-3 9L9 3l-3 9H2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BullseyeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={1.5} fill={color} />
    </Svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
