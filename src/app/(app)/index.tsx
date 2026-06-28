import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProLimitModal, ScreenBackground } from "@/components/ui";
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
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { useDrawer } from "@/lib/drawer-context";
import { useColors } from "@/lib/hooks";

export default function HomeScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { t } = useTranslation();
  const { maxTargetCurrencies } = useSettingsStore();
  const [isLimitModalOpen, setIsLimitModalOpen] = React.useState(false);

  const {
    baseCurrency,
    targetCurrencies,
    formattedAmount,
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
      <View style={homeStyles.container}>
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
          amount={formattedAmount}
          onScan={() => router.push("/price-scanner")}
          onEditBase={() => router.push("/my-rate")}
        />

        {/* Scrollable Target Currencies List */}
        <HomeTargetList
          isPro={isPro}
          baseCurrency={baseCurrency}
          targetCurrencies={targetCurrencies}
          maxTargetCurrencies={maxTargetCurrencies}
          getCurrencyInfo={getCurrencyInfo}
          getConvertedText={getConvertedText}
          getRateText={getRateText}
          swapBaseWithRow={swapBaseWithRow}
          removeCurrency={removeCurrency}
          onAddLimitReached={() => setIsLimitModalOpen(true)}
        />

        {/* Sponsored Ad Banner */}
        {!isPro && (
          <View style={homeStyles.adSlot}>
            <AdBanner onRemove={() => router.push("/paywall")} />
          </View>
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

      <ProLimitModal
        visible={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        onUpgrade={() => {
          setIsLimitModalOpen(false);
          setTimeout(() => {
            router.push("/paywall");
          }, 150);
        }}
        limit={maxTargetCurrencies}
        count={targetCurrencies.length}
      />
    </ScreenBackground>
  );
}

type HomeTargetListProps = {
  isPro: boolean;
  baseCurrency: string;
  targetCurrencies: string[];
  maxTargetCurrencies: number;
  getCurrencyInfo: (code: string) => { symbol: string; name: string };
  getConvertedText: (code: string) => string;
  getRateText: (code: string) => string;
  swapBaseWithRow: (code: string) => void;
  removeCurrency: (code: string) => void;
  onAddLimitReached: () => void;
};

function HomeTargetList({
  isPro,
  baseCurrency,
  targetCurrencies,
  maxTargetCurrencies,
  getCurrencyInfo,
  getConvertedText,
  getRateText,
  swapBaseWithRow,
  removeCurrency,
  onAddLimitReached,
}: HomeTargetListProps) {
  const router = useRouter();

  return (
    <ScrollView
      style={homeStyles.targetList}
      contentContainerStyle={homeStyles.targetListContent}
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
        onAdd={() => {
          if (!isPro && targetCurrencies.length >= maxTargetCurrencies) {
            onAddLimitReached();
          }
          else {
            router.push("/add-currency");
          }
        }}
      />
    </ScrollView>
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
  const { t } = useTranslation();

  return (
    <View style={homeStyles.header}>
      <Pressable
        onPress={onOpenMenu}
        className="rounded-xl border border-line bg-surface p-3 active:opacity-80"
        accessibilityLabel={t("converter.open_menu")}
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
        accessibilityLabel={t("converter.open_settings")}
      >
        <SettingsIcon color={colors.ink} width={20} height={20} />
      </Pressable>
    </View>
  );
}

const homeStyles = StyleSheet.create({
  adSlot: {
    flexShrink: 0,
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  container: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 60,
    paddingVertical: 8,
  },
  targetList: {
    flex: 1,
    marginVertical: 8,
  },
  targetListContent: {
    paddingBottom: 4,
  },
});
