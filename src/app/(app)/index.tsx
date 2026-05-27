import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ScreenBackground } from "@/components/ui";
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { AdBanner } from "@/features/converter/components/ad-banner";
// Components
import { BaseCard } from "@/features/converter/components/base-card";

import { MultiList } from "@/features/converter/components/multi-list";

import { Numpad } from "@/features/converter/components/numpad";
import { UpdatedSubtitle } from "@/features/converter/components/updated-subtitle";
// Hooks
import { useHomeScreenState } from "@/features/converter/hooks/use-home-screen-state";
import { useDrawer } from "@/lib/drawer-context";
import { useColors } from "@/lib/hooks";

export default function HomeScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { t } = useTranslation();

  const {
    baseCurrency,
    targetCurrencies,
    amount,
    isPro,
    updatedAt,
    isRefreshing,
    getCurrencyInfo,
    getConvertedText,
    getRateText,
    handleRefresh,
    swapBaseWithRow,
    removeCurrency,
    onTapDigit,
    onTapDot,
    onTapBackspace,
    onTapClear,
    onTapOperator,
    onTapDone,
  } = useHomeScreenState();

  const baseSymbol = getCurrencyInfo(baseCurrency).symbol;

  return (
    <ScreenBackground className="flex-1 bg-bg">
      <View className="flex-1 gap-2 px-4 pb-4">
        {/* Header Bar */}
        <HomeHeader
          isPro={isPro}
          updatedAt={updatedAt}
          isRefreshing={isRefreshing}
          onOpenMenu={openDrawer}
          onRefresh={handleRefresh}
          onOpenSettings={() => router.push("/settings")}
          onOpenPaywall={() => router.push("/paywall")}
          title={t("converter.title")}
          proLabel={t("converter.pro")}
        />

        {/* Base Currency Card */}
        <BaseCard
          baseCurrency={baseCurrency}
          symbol={baseSymbol}
          amount={amount}
          onScan={() => router.push("/price-scanner")}
          onEditBase={() => router.push("/my-rate")}
        />

        {/* Scrollable Target Currencies List */}
        <ScrollView
          className="my-1 flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <MultiList
            baseCurrency={baseCurrency}
            targets={targetCurrencies}
            getCurrencyInfo={getCurrencyInfo}
            getConvertedText={getConvertedText}
            getRateText={getRateText}
            onPromote={swapBaseWithRow}
            onRemove={removeCurrency}
            onAdd={() => router.push("/add-currency")}
          />
        </ScrollView>

        {/* Sponsored Ad Banner */}
        {!isPro && (
          <AdBanner onRemove={() => router.push("/paywall")} />
        )}

        {/* Bottom Numpad */}
        <Numpad
          onTapDigit={onTapDigit}
          onTapDot={onTapDot}
          onTapBackspace={onTapBackspace}
          onTapClear={onTapClear}
          onTapOperator={onTapOperator}
          onTapDone={onTapDone}
        />
      </View>
    </ScreenBackground>
  );
}

type HomeHeaderProps = {
  isPro: boolean;
  updatedAt: number | null;
  isRefreshing: boolean;
  onOpenMenu: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenPaywall: () => void;
  title: string;
  proLabel: string;
};

function HomeHeader({
  isPro,
  updatedAt,
  isRefreshing,
  onOpenMenu,
  onRefresh,
  onOpenSettings,
  onOpenPaywall,
  title,
  proLabel,
}: HomeHeaderProps) {
  const colors = useColors();

  return (
    <View className="flex-row items-center justify-between py-2">
      <Pressable
        onPress={onOpenMenu}
        className="rounded-xl border border-line bg-surface p-3 active:opacity-80"
        accessibilityLabel="Open Menu"
      >
        <MenuIcon color={colors.ink} />
      </Pressable>

      <View className="min-w-0 flex-1 flex-col items-center justify-center px-2">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-base font-extrabold text-ink" numberOfLines={1}>
            {title}
          </Text>
          {!isPro && (
            <Pressable
              onPress={onOpenPaywall}
              className="flex-row items-center gap-0.5 rounded-full bg-accent px-2 py-0.5 active:opacity-80"
            >
              <SparklesIcon color="#1A1A1C" size={10} />
              <Text className="text-[9px] font-black tracking-widest text-[#1A1A1C] uppercase">
                {proLabel}
              </Text>
            </Pressable>
          )}
        </View>
        <UpdatedSubtitle
          updatedAt={updatedAt}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      </View>

      <Pressable
        onPress={onOpenSettings}
        className="rounded-xl border border-line bg-surface p-3 active:opacity-80"
        accessibilityLabel="Open Settings"
      >
        <SettingsIcon color={colors.ink} width={20} height={20} />
      </Pressable>
    </View>
  );
}
