import type { CurrencyPickerTab } from "@/features/converter/hooks/use-currency-picker-state";
import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenBackground } from "@/components/ui";
import { BackIcon, SearchIcon } from "@/components/ui/icons";
import { useThemeColors } from "@/components/ui/use-theme-colors";
import { CurrencyMedallion } from "@/features/converter/components/currency-medallion";
import { useCurrencyPickerState } from "@/features/converter/hooks/use-currency-picker-state";
import { useConverterStore } from "@/features/converter/store/use-converter-store";

export default function AddCurrencyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const addCurrency = useConverterStore(state => state.addCurrency);
  const colors = useThemeColors();

  const {
    q,
    setQ,
    tab,
    setTab,
    groups,
    isTaken,
    getFormattedRate,
  } = useCurrencyPickerState();

  const handlePick = (code: string) => {
    addCurrency(code);
    router.back();
  };

  return (
    <ScreenBackground className="flex-1 bg-bg">
      <View className="flex-1 px-4 pb-4">
        {/* Centered Header Bar */}
        <View className="mb-4 h-[52px] flex-row items-center justify-between py-2">
          <View className="w-10 items-start">
            <Pressable
              onPress={() => router.back()}
              className="size-10 items-center justify-center rounded-full border border-line bg-surface active:opacity-80"
              accessibilityLabel="Go back"
            >
              <BackIcon color={colors.ink} size={22} />
            </Pressable>
          </View>
          <Text className="flex-1 text-center text-[17px] font-extrabold text-ink" numberOfLines={1}>
            {t("converter.add_currency")}
          </Text>
          <View className="w-10" />
        </View>

        {/* Search Input Box */}
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder={t("converter.search")}
        />

        {/* Segmented Filter Tabs */}
        <CategoryTabs
          activeTab={tab}
          onSelectTab={setTab}
          fiatLabel={t("converter.fiat")}
          cryptoLabel={t("converter.crypto")}
          allLabel={t("converter.all")}
        />

        {/* Currency List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {groups.map(group => (
            <View key={group.type} className="mb-4">
              {/* Section Header */}
              <View className="flex-row items-center justify-between px-1.5 pt-1.5 pb-2.5">
                <Text className="text-[11px] font-bold tracking-widest text-ink-soft uppercase">
                  {group.label}
                </Text>
                <Text className="text-[11px] font-semibold text-ink-soft">
                  {group.items.length}
                  {" / "}
                  {group.totalLabel}
                </Text>
              </View>

              {/* Items List */}
              {group.items.map(item => (
                <CurrencyRow
                  key={item.code}
                  item={item}
                  rateText={getFormattedRate(item.code)}
                  isTaken={isTaken(item.code)}
                  onSelect={() => handlePick(item.code)}
                />
              ))}
            </View>
          ))}

          <Text className="py-4 text-center text-xs font-bold text-ink-soft">
            {t("converter.fullList")}
          </Text>
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}

type SearchBoxProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
};

function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  const colors = useThemeColors();
  return (
    <View className="mb-4 flex-row items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3">
      <SearchIcon color={colors.inkMute} size={20} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        className="flex-1 bg-transparent text-[15px] font-medium text-ink"
        style={{ padding: 0 }}
      />
    </View>
  );
}

type CategoryTabsProps = {
  activeTab: CurrencyPickerTab;
  onSelectTab: (tab: CurrencyPickerTab) => void;
  allLabel: string;
  fiatLabel: string;
  cryptoLabel: string;
};

function CategoryTabs({
  activeTab,
  onSelectTab,
  allLabel,
  fiatLabel,
  cryptoLabel,
}: CategoryTabsProps) {
  const tabs = [
    { id: "all" as const, label: allLabel },
    { id: "fiat" as const, label: fiatLabel },
    { id: "crypto" as const, label: cryptoLabel },
  ];

  return (
    <View className="mb-4 flex-row gap-1.5 rounded-[14px] border border-line bg-surface p-1">
      {tabs.map(tab => (
        <Pressable
          key={tab.id}
          onPress={() => onSelectTab(tab.id)}
          className={`flex-1 items-center justify-center rounded-[10px] py-2.5 ${
            activeTab === tab.id ? "bg-ink" : "bg-transparent"
          }`}
        >
          <Text
            className={`text-sm font-bold tracking-tight ${
              activeTab === tab.id ? "text-bg" : "text-ink-mute"
            }`}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

type CurrencyRowProps = {
  item: any;
  rateText: string;
  isTaken: boolean;
  onSelect: () => void;
};

function CurrencyRow({ item, rateText, isTaken, onSelect }: CurrencyRowProps) {
  return (
    <Pressable
      onPress={onSelect}
      disabled={isTaken}
      className={`mb-1.5 w-full flex-row items-center gap-3.5 rounded-[16px] border border-line bg-surface px-3.5 py-3 ${
        isTaken ? "opacity-40" : "active:bg-black/5 dark:active:bg-white/5"
      }`}
    >
      <CurrencyMedallion code={item.code} flag={item.flag_emoji} size={40} />

      <View className="min-w-0 flex-1 justify-center">
        <Text className="text-[15px] font-extrabold tracking-tight text-ink">
          {item.code}
          {" "}
          <Text className="text-xs font-semibold text-ink/50">
            {item.symbol}
          </Text>
        </Text>
        <Text className="mt-0.5 text-xs font-semibold text-ink-mute" numberOfLines={1}>
          {item.name}
        </Text>
      </View>

      <View className="items-end justify-center pr-1">
        <Text className="text-[10px] leading-none font-bold text-ink-soft uppercase">
          1 USD =
        </Text>
        <Text className="mt-0.5 text-[13px] font-bold text-ink">
          {rateText}
        </Text>
      </View>
    </Pressable>
  );
}
