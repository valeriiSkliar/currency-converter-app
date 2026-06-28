import * as React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Share as ShareIcon } from "./ui/icons/share";
import { Support as SupportIcon } from "./ui/icons/support";

type DrawerMenuProps = {
  isPro: boolean;
  enableExchangeRates?: boolean;
  onNavigate: (route: string) => void;
  onRemoveAds: () => void;
  onShare: () => void;
  onRate: () => void;
  onOpenPrivacy: () => void;
};

export function DrawerMenu({
  isPro,
  enableExchangeRates,
  onNavigate,
  onRemoveAds,
  onShare,
  onRate,
  onOpenPrivacy,
}: DrawerMenuProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="h-full w-70 flex-1 bg-surface"
      style={{ paddingTop: 0, paddingBottom: 0 }}
    >
      <DrawerHeader isPro={isPro} topInset={insets.top} />
      <DrawerContent
        isPro={isPro}
        enableExchangeRates={enableExchangeRates}
        onNavigate={onNavigate}
        onRemoveAds={onRemoveAds}
        onShare={onShare}
        onRate={onRate}
        onOpenPrivacy={onOpenPrivacy}
      />
    </View>
  );
}

function DrawerHeader({ isPro, topInset = 0 }: { isPro: boolean; topInset?: number }) {
  const { t } = useTranslation();
  return (
    <View
      className="relative justify-end overflow-hidden p-5"
      style={{ minHeight: 160 + topInset }}
    >
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="drawerHeaderGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0057B7" />
            <Stop offset="100%" stopColor="#002D62" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#drawerHeaderGrad)" />
      </Svg>
      {/* App Logo */}
      <View className="mb-2 self-start rounded-xl bg-white/20 p-2">
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            stroke="#FFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text className="mb-1 text-xl font-bold text-white">
        {t("converter.title")}
      </Text>
      <Text className="text-xs text-white/70">
        {isPro ? t("drawer.pro_plan") : t("drawer.free_plan")}
      </Text>
    </View>
  );
}

type DrawerContentProps = {
  isPro: boolean;
  enableExchangeRates?: boolean;
  onNavigate: (route: string) => void;
  onRemoveAds: () => void;
  onShare: () => void;
  onRate: () => void;
  onOpenPrivacy: () => void;
};

function DrawerContent({
  isPro,
  enableExchangeRates,
  onNavigate,
  onRemoveAds,
  onShare,
  onRate,
  onOpenPrivacy,
}: DrawerContentProps) {
  const { t } = useTranslation();
  return (
    <ScrollView className="flex-1 p-4" bounces={false}>
      {/* Monetization Yellow Button */}
      {!isPro && (
        <TouchableOpacity
          onPress={onRemoveAds}
          activeOpacity={0.8}
          className="mb-4 flex-row items-center justify-center rounded-2xl border border-line bg-accent p-4"
        >
          <Text className="text-sm font-bold text-accent-ink">
            {t("drawer.remove_ads")}
          </Text>
        </TouchableOpacity>
      )}

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
