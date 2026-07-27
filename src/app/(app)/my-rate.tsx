import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ScreenBackground } from "@/components/ui";
import { BackIcon, CaretDown, SparklesIcon, SwapHIcon } from "@/components/ui/icons";
import { useThemeColors } from "@/components/ui/use-theme-colors";
import { useAdFrequencyStore } from "@/features/ads/use-ad-frequency-store";
import { useCurrencies } from "@/features/converter/api/use-rates";
import { useExchangeRates } from "@/features/converter/hooks/use-exchange-rates";
import { useConverterStore } from "@/features/converter/store/use-converter-store";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { getExchangeRate } from "@/features/converter/utils/conversion-helpers";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";

type FormatRateOptions = {
  rate: number;
  isToCrypto: boolean;
  decimalPlaces: number;
  locale: string;
};

function formatRateText({ rate, isToCrypto, decimalPlaces, locale }: FormatRateOptions): string {
  const d = isToCrypto
    ? 8
    : rate >= 1000
      ? 0
      : rate >= 1
        ? Math.min(4, decimalPlaces)
        : Math.min(6, Math.max(4, decimalPlaces));
  return rate.toLocaleString(locale, {
    maximumFractionDigits: d,
  });
}

type FormatConversionOptions = {
  convertedValue: number;
  isToCrypto: boolean;
  decimalPlaces: number;
  locale: string;
};

function formatConvertedValueText({ convertedValue, isToCrypto, decimalPlaces, locale }: FormatConversionOptions): string {
  const minDecimals = isToCrypto ? 6 : Math.min(decimalPlaces, 2);
  const maxDecimals = isToCrypto ? 8 : decimalPlaces;
  return convertedValue.toLocaleString(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

function useMyRateState() {
  const router = useRouter();
  const { baseCurrency, targetCurrencies, customRates, setCustomRate } = useConverterStore();
  const { isPro, customRateAttempts, incrementRateAttempt } = useQuotaStore();
  const registerAdAction = useAdFrequencyStore(state => state.registerAction);
  const { decimalPlaces, language } = useSettingsStore();
  const [from, setFrom] = React.useState(baseCurrency);
  const [to, setTo] = React.useState(targetCurrencies[0] || "EUR");
  const [amount, setAmount] = React.useState("1");
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isPickerOpen, setIsPickerOpen] = React.useState<{ side: "from" | "to" } | null>(null);
  const [draft, setDraft] = React.useState("");

  const { data: currenciesData } = useCurrencies();
  const { rates } = useExchangeRates();

  const FREE = 3;
  const used = Math.min(customRateAttempts, FREE);
  const limitReached = !isPro && used >= FREE;

  const liveRate = React.useMemo(() => getExchangeRate({ from, to, rates, customRates: {} }), [from, to, rates]);

  const directPair = `${from}_${to}`;
  const customRate = customRates[directPair];
  const effectiveRate = customRate !== undefined ? customRate : liveRate;

  const parsedAmount = Number.parseFloat(amount.replace(/,/g, ".")) || 0;
  const convertedValue = parsedAmount * effectiveRate;

  const locale = language === "ru" ? "ru-RU" : "en-US";
  const isToCrypto = currenciesData?.find(c => c.code === to)?.type === "crypto";

  const formattedEffectiveRateText = React.useMemo(
    () => formatRateText({ rate: effectiveRate, isToCrypto, decimalPlaces, locale }),
    [effectiveRate, isToCrypto, decimalPlaces, locale],
  );
  const formattedLiveRateText = React.useMemo(
    () => formatRateText({ rate: liveRate, isToCrypto, decimalPlaces, locale }),
    [liveRate, isToCrypto, decimalPlaces, locale],
  );
  const formattedConvertedValueText = React.useMemo(
    () => formatConvertedValueText({ convertedValue, isToCrypto, decimalPlaces, locale }),
    [convertedValue, isToCrypto, decimalPlaces, locale],
  );

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleReset = () => {
    const next = { ...customRates };
    delete next[directPair];
    delete next[`${to}_${from}`];
    useConverterStore.setState({ customRates: next });
  };

  const handleOpenEdit = () => {
    if (limitReached) {
      router.push("/paywall");
      return;
    }
    setDraft(effectiveRate.toFixed(isToCrypto ? 8 : 4).replace(/\.?0+$/, ""));
    setIsEditOpen(true);
  };

  const handleSaveRate = (value: number) => {
    setCustomRate(directPair, value);
    if (!isPro) {
      incrementRateAttempt();
      registerAdAction();
    }
    setIsEditOpen(false);
  };

  const selectableCurrencies = React.useMemo(() => [baseCurrency, ...targetCurrencies], [baseCurrency, targetCurrencies]);

  const fromInfo = getCurrencyInfo(from, currenciesData);
  const toInfo = getCurrencyInfo(to, currenciesData);

  return {
    router,
    isPro,
    customRateAttempts,
    from,
    setFrom,
    to,
    setTo,
    amount,
    setAmount,
    isEditOpen,
    setIsEditOpen,
    isPickerOpen,
    setIsPickerOpen,
    draft,
    setDraft,
    customRate,
    formattedEffectiveRateText,
    formattedLiveRateText,
    formattedConvertedValueText,
    handleSwap,
    handleReset,
    handleOpenEdit,
    handleSaveRate,
    selectableCurrencies,
    fromInfo,
    toInfo,
    currenciesData,
  };
}

export default function MyRateScreen() {
  const {
    router,
    isPro,
    customRateAttempts,
    from,
    setFrom,
    to,
    setTo,
    amount,
    setAmount,
    isEditOpen,
    setIsEditOpen,
    isPickerOpen,
    setIsPickerOpen,
    draft,
    setDraft,
    customRate,
    formattedEffectiveRateText,
    formattedLiveRateText,
    formattedConvertedValueText,
    handleSwap,
    handleReset,
    handleOpenEdit,
    handleSaveRate,
    selectableCurrencies,
    fromInfo,
    toInfo,
    currenciesData,
  } = useMyRateState();

  return (
    <ScreenBackground className="flex-1 bg-bg">
      <View className="flex-1 px-4 pb-4">
        <MyRateHeader
          isPro={isPro}
          onBack={() => router.back()}
          onOpenPaywall={() => router.push("/paywall")}
        />

        <ScrollView
          className="mt-3 flex-1"
          showsVerticalScrollIndicator={false}
        >
          <AttemptsQuotaBanner
            isPro={isPro}
            attempts={customRateAttempts}
          />

          <ExchangeComparisonCard
            from={from}
            to={to}
            formattedEffectiveRateText={formattedEffectiveRateText}
            formattedLiveRateText={formattedLiveRateText}
            hasCustomRate={customRate !== undefined}
            onReset={handleReset}
            onChangeRate={handleOpenEdit}
          />

          <SandboxConversionForm
            from={from}
            to={to}
            amount={amount}
            onAmountChange={setAmount}
            formattedConvertedValue={formattedConvertedValueText}
            onSwap={handleSwap}
            onSelectFrom={() => setIsPickerOpen({ side: "from" })}
            onSelectTo={() => setIsPickerOpen({ side: "to" })}
            fromFlag={fromInfo.flag}
            toFlag={toInfo.flag}
          />
        </ScrollView>
      </View>

      <EditRateOverlayModal
        visible={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveRate}
        from={from}
        to={to}
        draft={draft}
        onDraftChange={setDraft}
      />

      <CurrencyPickerModal
        visible={isPickerOpen !== null}
        onClose={() => setIsPickerOpen(null)}
        currencies={selectableCurrencies}
        getCurrencyInfo={code => getCurrencyInfo(code, currenciesData)}
        selectedCurrency={isPickerOpen?.side === "from" ? from : to}
        onSelect={(code) => {
          if (isPickerOpen?.side === "from") {
            setFrom(code);
          }
          else {
            setTo(code);
          }
        }}
      />
    </ScreenBackground>
  );
}

type MyRateHeaderProps = {
  isPro: boolean;
  onBack: () => void;
  onOpenPaywall: () => void;
};

export function MyRateHeader({ isPro, onBack, onOpenPaywall }: MyRateHeaderProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View className="h-[52px] flex-row items-center justify-between border-b border-line px-1.5 py-2">
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        className="size-8 items-center justify-center rounded-full bg-transparent active:opacity-75"
        accessibilityLabel={t("converter.go_back")}
      >
        <BackIcon
          color={colors.ink}
          size={22}
        />
      </TouchableOpacity>

      <Text
        className="flex-1 px-2.5 text-[17px] font-extrabold text-ink"
        numberOfLines={1}
      >
        {t("converter.myRate")}
      </Text>

      {!isPro && (
        <TouchableOpacity
          onPress={onOpenPaywall}
          activeOpacity={0.8}
          className="flex-row items-center gap-1 rounded-full bg-accent px-3 py-1.5 shadow-sm"
        >
          <SparklesIcon
            color="#1A1A1C"
            size={11}
          />
          <Text className="text-[10px] leading-none font-black tracking-widest text-[#1A1A1C] uppercase">
            {t("converter.pro")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

type AttemptsQuotaBannerProps = {
  isPro: boolean;
  attempts: number;
};

export function AttemptsQuotaBanner({ isPro, attempts }: AttemptsQuotaBannerProps) {
  const { t } = useTranslation();
  const FREE = 3;
  const used = Math.min(attempts, FREE);
  const limitReached = used >= FREE;

  return (
    <View className="relative overflow-hidden rounded-2xl bg-ink p-4">
      {/* Decorative Bubbles */}
      <View
        className="absolute -top-3 -right-2.5 rounded-full bg-current/5"
        style={{ width: 64, height: 64 }}
      />
      <View
        className="absolute right-15 -bottom-4.5 rounded-full bg-current/5"
        style={{ width: 48, height: 48 }}
      />

      <View className="flex-row items-center justify-between gap-2.5">
        <Text className="flex-1 text-sm/normal font-bold text-bg">
          {isPro
            ? (
                `✨ ${t("converter.pro")}`
              )
            : limitReached
              ? (
                  t("converter.freeAttemptsAllUsed")
                )
              : (
                  <Text>
                    <Text className="font-black">
                      {used}
                      /
                      {FREE}
                    </Text>
                    {" "}
                    {t("converter.freeAttemptsUsed")}
                  </Text>
                )}
        </Text>

        {!isPro && (
          <View className="rounded-full bg-accent px-2 py-1 shadow-inner">
            <Text className="text-[10px] font-black tracking-widest text-[#1A1A1C] uppercase">
              {t("converter.pro")}
            </Text>
          </View>
        )}
      </View>

      {/* Attempts Progress Bar */}
      {!isPro && (
        <View className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: `${(used / FREE) * 100}%` }}
          />
        </View>
      )}
    </View>
  );
}

type ExchangeComparisonCardProps = {
  from: string;
  to: string;
  formattedEffectiveRateText: string;
  formattedLiveRateText: string;
  hasCustomRate: boolean;
  onReset: () => void;
  onChangeRate: () => void;
};

export function ExchangeComparisonCard({
  from,
  to,
  formattedEffectiveRateText,
  formattedLiveRateText,
  hasCustomRate,
  onReset,
  onChangeRate,
}: ExchangeComparisonCardProps) {
  const { t } = useTranslation();

  return (
    <View className="mt-3.5 rounded-[18px] border border-line bg-surface p-4.5">
      <View className="mb-2 flex-row items-baseline justify-between">
        <Text className="text-base font-extrabold text-ink">
          {t("converter.exchangeRate")}
        </Text>
        {hasCustomRate && (
          <TouchableOpacity
            onPress={onReset}
            activeOpacity={0.7}
          >
            <Text className="text-sm font-bold text-red-500">
              {t("converter.reset")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-[26px] font-black text-ink">
        1
        {" "}
        {from}
        {" "}
        =
        {" "}
        {formattedEffectiveRateText}
        {" "}
        {to}
      </Text>

      <Text className="mt-2 text-xs font-semibold text-ink-mute">
        {t("converter.liveRate")}
        :
        {" "}
        <Text className="font-extrabold">
          1
          {" "}
          {from}
          {" "}
          =
          {" "}
          {formattedLiveRateText}
          {" "}
          {to}
        </Text>
      </Text>

      <TouchableOpacity
        onPress={onChangeRate}
        activeOpacity={0.8}
        className="mt-4 w-full items-center justify-center rounded-full bg-ink py-4"
      >
        <Text className="text-sm font-black tracking-widest text-bg uppercase">
          {t("converter.changeRate")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

type SandboxConversionFormProps = {
  from: string;
  to: string;
  amount: string;
  onAmountChange: (text: string) => void;
  formattedConvertedValue: string;
  onSwap: () => void;
  onSelectFrom: () => void;
  onSelectTo: () => void;
  fromFlag: string;
  toFlag: string;
};

export function SandboxConversionForm({
  from,
  to,
  amount,
  onAmountChange,
  formattedConvertedValue,
  onSwap,
  onSelectFrom,
  onSelectTo,
  fromFlag,
  toFlag,
}: SandboxConversionFormProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View className="mt-6 flex-row items-start gap-2.5">
      {/* FROM Side */}
      <View className="flex-1 gap-3">
        <TouchableOpacity
          onPress={onSelectFrom}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
          accessibilityRole="button"
          accessibilityLabel={t("converter.select_from_currency")}
        >
          <CurrencyFlagBox
            flag={fromFlag}
            code={from}
          />
          <Text className="text-lg font-bold text-ink">{from}</Text>
          <CaretDown color={colors.inkMute} />
        </TouchableOpacity>

        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          keyboardType="decimal-pad"
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-lg font-bold text-ink"
          style={{ paddingVertical: 10 }}
          accessibilityLabel={t("converter.amount")}
        />
      </View>

      {/* SWAP Button */}
      <TouchableOpacity
        onPress={onSwap}
        activeOpacity={0.8}
        className="mt-1 size-9 items-center justify-center rounded-full border border-line bg-surface active:bg-chip"
        accessibilityRole="button"
        accessibilityLabel={t("converter.swap")}
      >
        <SwapHIcon
          color={colors.ink}
          size={20}
        />
      </TouchableOpacity>

      {/* TO Side */}
      <View className="flex-1 items-end gap-3">
        <TouchableOpacity
          onPress={onSelectTo}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
          accessibilityRole="button"
          accessibilityLabel={t("converter.select_to_currency")}
        >
          <CurrencyFlagBox
            flag={toFlag}
            code={to}
          />
          <Text className="text-lg font-bold text-ink">{to}</Text>
          <CaretDown color={colors.inkMute} />
        </TouchableOpacity>

        <View className="w-full items-end pr-1.5">
          <Text className="text-[11px] font-bold text-ink-soft uppercase">
            {t("converter.customRate")}
          </Text>
          <Text
            className="mt-1 text-2xl font-black text-ink"
            numberOfLines={1}
          >
            {formattedConvertedValue}
          </Text>
        </View>
      </View>
    </View>
  );
}

type EditRateOverlayModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (val: number) => void;
  from: string;
  to: string;
  draft: string;
  onDraftChange: (text: string) => void;
};

export function EditRateOverlayModal({
  visible,
  onClose,
  onSave,
  from,
  to,
  draft,
  onDraftChange,
}: EditRateOverlayModalProps) {
  const { t } = useTranslation();

  const handleSave = () => {
    const v = Number.parseFloat(draft.replace(",", "."));
    if (Number.isFinite(v) && v > 0) {
      onSave(v);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/55 p-5"
        onPress={onClose}
      >
        <Pressable className="w-full max-w-[325px] rounded-[24px] border border-line bg-surface p-[22px] shadow-2xl">
          <Text className="text-lg font-bold text-ink">
            {t("converter.setRate")}
          </Text>

          <Text className="mt-1.5 text-xs/relaxed text-ink-mute">
            {t("converter.setRateHint", { from, to })}
          </Text>

          <View className="mt-4 flex-row items-center gap-2.5">
            <Text className="text-[14px] font-bold text-ink-mute">
              1
              {" "}
              {from}
              {" "}
              =
            </Text>
            <TextInput
              value={draft}
              onChangeText={onDraftChange}
              keyboardType="numeric"
              autoFocus
              className="flex-1 rounded-xl border border-line bg-bg px-3.5 py-3 text-[18px] font-black text-ink"
              style={{ paddingVertical: 10 }}
              accessibilityLabel={t("converter.customRate")}
            />
            <Text className="text-[14px] font-bold text-ink-mute">
              {to}
            </Text>
          </View>

          <View className="mt-[18px] flex-row gap-2.5">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center rounded-full border border-line bg-chip py-3.5"
            >
              <Text className="text-sm font-bold text-ink">
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              className="flex-[1.4] items-center justify-center rounded-full bg-ink py-3.5"
            >
              <Text className="text-sm font-black text-bg">
                {t("converter.save")}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type CurrencyPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  currencies: string[];
  getCurrencyInfo: (code: string) => { name: string; flag: string };
  selectedCurrency: string;
};

export function CurrencyPickerModal({
  visible,
  onClose,
  onSelect,
  currencies,
  getCurrencyInfo,
  selectedCurrency,
}: CurrencyPickerModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/55 p-5"
        onPress={onClose}
      >
        <Pressable className="w-full max-w-[300px] rounded-[24px] border border-line bg-surface p-4 shadow-2xl">
          <ScrollView
            className="max-h-[300px]"
            showsVerticalScrollIndicator={false}
          >
            {currencies.map((code) => {
              const info = getCurrencyInfo(code);
              const isSelected = code === selectedCurrency;
              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => {
                    onSelect(code);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  className={`mb-1 flex-row items-center gap-3.5 rounded-xl px-3 py-2.5 ${
                    isSelected ? "bg-accent/15" : "active:bg-chip"
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`${code}, ${info.name}`}
                >
                  <CurrencyFlagBox
                    flag={info.flag}
                    code={code}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-ink">{code}</Text>
                    <Text className="text-[10px] text-ink-mute">{info.name}</Text>
                  </View>
                  {isSelected && (
                    <Text className="rounded-md bg-accent px-2 py-0.5 text-xs font-black text-accent-ink">✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CurrencyFlagBox({ flag, code }: { flag: string; code: string }) {
  return (
    <View
      className="shrink-0 items-center justify-center overflow-hidden rounded-[6px]"
      style={{ width: 36, height: 26 }}
    >
      <FlagGradientBackground code={code} />
      <Text className="text-[16px] font-extrabold text-white">
        {flag}
      </Text>
    </View>
  );
}

const FLAG_GRADIENTS: Record<string, string[]> = {
  USD: ["#1F3DCF", "#3D86F5", "#7AC6FF"],
  EUR: ["#0F2D8A", "#2E5BD6", "#FFD200"],
  RUB: ["#5C0A0A", "#A1242E", "#E8D7B5"],
  GBP: ["#3B0B6E", "#7A2AC0", "#FF7AD2"],
  JPY: ["#7A0E1F", "#D7263D", "#FFD9DE"],
  CNY: ["#8A1010", "#D72E1F", "#FFCE3C"],
  CHF: ["#7E0F1B", "#D6303C", "#FFE0E2"],
  CAD: ["#7E0F1B", "#E4444F", "#FFB8B8"],
  AUD: ["#0A2A6E", "#2A66C7", "#F5D04B"],
  NZD: ["#0E2257", "#385FB1", "#9FB6E4"],
  INR: ["#7A3D00", "#E07A1A", "#0E7B3B"],
  KRW: ["#0A2C6E", "#2A66C7", "#C73A4A"],
  TRY: ["#5E0E14", "#C22531", "#FFE9EB"],
  BRL: ["#0B3D1A", "#1F8A3E", "#FFD835"],
  MXN: ["#0B3D1A", "#1F8A3E", "#C73A4A"],
  SEK: ["#0A2A6E", "#2A66C7", "#F5D04B"],
  PLN: ["#6E0A0A", "#C72A2A", "#F2E9E0"],
  AED: ["#1B5E20", "#2E7D32", "#C09A3E"],
  SGD: ["#7E0F1B", "#E0444F", "#FFFFFF"],
  HKD: ["#7E0F1B", "#D6303C", "#FFCFCF"],
  BTC: ["#7A2B00", "#E07A1A", "#FFC65C"],
  ETH: ["#2C0A6E", "#5B47C2", "#9FA7FF"],
  USDT: ["#0B4A3F", "#1FA88A", "#7CE0C6"],
  BNB: ["#5E4A00", "#E0B500", "#FFE779"],
  SOL: ["#3A0E5C", "#8B2AC2", "#3DE0C2"],
  XRP: ["#0E1B2E", "#27324A", "#7C8AA8"],
  ADA: ["#0A2658", "#1E5DB8", "#7BAFE8"],
  DOGE: ["#5C4A0A", "#C2A22A", "#F2D866"],
};

const DEFAULT_FLAG_GRADIENT = ["#475569", "#64748B", "#94A3B8"];

function FlagGradientBackground({ code }: { code: string }) {
  const gradient = FLAG_GRADIENTS[code.toUpperCase()] || DEFAULT_FLAG_GRADIENT;
  return (
    <Svg
      style={StyleSheet.absoluteFillObject}
      width="100%"
      height="100%"
    >
      <Defs>
        <LinearGradient
          id={`flagGrad-${code}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <Stop
            offset="0%"
            stopColor={gradient[0]}
          />
          <Stop
            offset="55%"
            stopColor={gradient[1]}
          />
          <Stop
            offset="100%"
            stopColor={gradient[2]}
          />
        </LinearGradient>
      </Defs>
      <Rect
        width="100%"
        height="100%"
        rx={4}
        fill={`url(#flagGrad-${code})`}
      />
    </Svg>
  );
}

function getCurrencyInfo(code: string, currenciesData: any[] | undefined) {
  const found = currenciesData?.find(c => c.code === code);
  if (found) {
    return {
      name: found.name || code,
      symbol: found.symbol || code,
      flag: found.flag_emoji || code,
    };
  }
  // API data not yet available — use code as neutral placeholder
  return { name: code, symbol: code, flag: code };
}
