import type { ScanErrorReason, ScanPhase } from "@/features/converter/hooks/use-price-scanner-engine";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ScreenBackground } from "@/components/ui";
import { BackIcon, CameraIcon } from "@/components/ui/icons";
import { useThemeColors } from "@/components/ui/use-theme-colors";
import { useCurrencies } from "@/features/converter/api/use-rates";
import { useExchangeRates } from "@/features/converter/hooks/use-exchange-rates";
import { usePriceScannerEngine } from "@/features/converter/hooks/use-price-scanner-engine";
import { useConverterStore } from "@/features/converter/store/use-converter-store";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { getExchangeRate } from "@/features/converter/utils/conversion-helpers";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";

const styles = {
  camera: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

function getCurrencyInfo(code: string, currenciesData: any[] | undefined) {
  const found = currenciesData?.find(c => c.code === code);
  if (found) {
    return {
      name: found.name || code,
      flag: found.flag_emoji || "🏳️",
    };
  }
  const fallbacks: Record<string, { name: string; flag: string }> = {
    USD: { name: "US Dollar", flag: "🇺🇸" },
    EUR: { name: "Euro", flag: "🇪🇺" },
    RUB: { name: "Russian Ruble", flag: "🇷🇺" },
    GBP: { name: "British Pound", flag: "🇬🇧" },
    JPY: { name: "Japanese Yen", flag: "🇯🇵" },
  };
  return fallbacks[code] || { name: code, flag: "🏳️" };
}

export function ScannerHeader({
  isPro,
  onBack,
  onOpenPaywall,
}: {
  isPro: boolean;
  onBack: () => void;
  onOpenPaywall: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="absolute inset-x-0 top-0 z-10 h-[52px] flex-row items-center justify-between px-4 py-2">
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        className="size-10 items-center justify-center rounded-full bg-black/40"
      >
        <BackIcon color="#FFFFFF" size={22} />
      </TouchableOpacity>

      <Text className="text-base font-extrabold text-white">
        {t("converter.priceScanner")}
      </Text>

      {!isPro
        ? (
            <TouchableOpacity
              onPress={onOpenPaywall}
              activeOpacity={0.8}
              className="rounded-full bg-accent px-3 py-1.5 shadow-sm"
            >
              <Text className="text-[10px] font-black text-accent-ink uppercase">
                {t("converter.pro")}
              </Text>
            </TouchableOpacity>
          )
        : (
            <View className="w-10" />
          )}
    </View>
  );
}

export function CurrencySelectorBar({
  from,
  to,
  onSwap,
  onSelectBase,
  onSelectTarget,
  getCurrencyInfo: resolveInfo,
}: {
  from: string;
  to: string;
  onSwap: () => void;
  onSelectBase: () => void;
  onSelectTarget: () => void;
  getCurrencyInfo: (code: string) => { name: string; flag: string };
}) {
  const fromInfo = resolveInfo(from);
  const toInfo = resolveInfo(to);

  return (
    <View className="absolute inset-x-4 top-16 z-10 flex-row items-center justify-between rounded-full bg-black/40 px-4 py-2">
      <TouchableOpacity
        onPress={onSelectBase}
        activeOpacity={0.7}
        className="flex-row items-center gap-1.5"
      >
        <Text className="text-lg">{fromInfo.flag}</Text>
        <Text className="text-sm font-bold text-white">{from}</Text>
        <Text className="text-[10px] text-white/60">▼</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSwap}
        activeOpacity={0.7}
        className="size-8 items-center justify-center rounded-full bg-white/10"
      >
        <Text className="text-base text-white">⇄</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSelectTarget}
        activeOpacity={0.7}
        className="flex-row items-center gap-1.5"
      >
        <Text className="text-lg">{toInfo.flag}</Text>
        <Text className="text-sm font-bold text-white">{to}</Text>
        <Text className="text-[10px] text-white/60">▼</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ViewfinderControls({
  zoom,
  onZoomChange,
  flashlight,
  onFlashlightToggle,
}: {
  zoom: number;
  onZoomChange: (val: number) => void;
  flashlight: boolean;
  onFlashlightToggle: () => void;
}) {
  return (
    <View className="absolute inset-x-4 bottom-20 z-10 flex-row items-center justify-between px-4 py-2">
      <View className="flex-row items-center gap-2 rounded-full bg-black/45 px-3 py-1.5">
        <Text className="mr-1 text-[10px] font-black text-white/50 uppercase">Zoom</Text>
        <TouchableOpacity
          onPress={() => onZoomChange(Math.max(0, zoom - 0.25))}
          activeOpacity={0.7}
          className="size-6 items-center justify-center rounded-full bg-white/10"
        >
          <Text className="text-sm font-bold text-white">-</Text>
        </TouchableOpacity>
        <Text className="text-xs font-bold text-white">{`${Math.round(1 + zoom * 2)}x`}</Text>
        <TouchableOpacity
          onPress={() => onZoomChange(Math.min(1, zoom + 0.25))}
          activeOpacity={0.7}
          className="size-6 items-center justify-center rounded-full bg-white/10"
        >
          <Text className="text-sm font-bold text-white">+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onFlashlightToggle}
        activeOpacity={0.7}
        className={`size-11 items-center justify-center rounded-full border border-white/20 ${
          flashlight ? "bg-white" : "bg-black/40"
        }`}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            stroke={flashlight ? "#0E0E10" : "#FFFFFF"}
            strokeWidth={2}
            fill={flashlight ? "#FFD200" : "none"}
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

export function LimitBanner({
  count,
  limit,
  onOpenPaywall,
}: {
  count: number;
  limit: number;
  onOpenPaywall: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="absolute inset-x-4 bottom-4 z-10 flex-row items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/90 p-3.5">
      <Text className="text-xs font-semibold text-white/70">
        {t("converter.freeScansUsed", { count, limit })}
      </Text>
      <TouchableOpacity
        onPress={onOpenPaywall}
        activeOpacity={0.8}
        className="rounded-full bg-accent px-3 py-1"
      >
        <Text className="text-[10px] font-black text-accent-ink uppercase">
          {t("converter.pro")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function ShutterButton({
  phase,
  onCapture,
}: {
  phase: ScanPhase;
  onCapture: () => void;
}) {
  const { t } = useTranslation();
  const isCapturing = phase === "capturing";

  return (
    <TouchableOpacity
      onPress={onCapture}
      activeOpacity={0.75}
      disabled={isCapturing}
      accessibilityLabel={t("converter.shutterButtonLabel")}
      accessibilityRole="button"
      accessibilityState={{ busy: isCapturing, disabled: isCapturing }}
      className={`absolute bottom-20 left-1/2 z-20 size-[72px] -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-white/20 ${
        isCapturing ? "opacity-70" : "opacity-100"
      }`}
    >
      <View className="size-[54px] items-center justify-center rounded-full bg-white">
        {isCapturing
          ? <ActivityIndicator size="small" color="#0E0E10" />
          : <View className="size-[42px] rounded-full bg-accent" />}
      </View>
    </TouchableOpacity>
  );
}

export function ScanErrorBanner({
  reason,
}: {
  reason: ScanErrorReason | null;
}) {
  const { t } = useTranslation();

  if (reason === null)
    return null;

  const messageKey = reason === "not_found"
    ? "converter.priceNotFound"
    : "converter.captureFailed";

  return (
    <View className="absolute inset-x-8 bottom-40 z-20 rounded-2xl border border-white/15 bg-neutral-900/90 px-4 py-3">
      <Text className="text-center text-xs font-bold text-white">
        {t(messageKey)}
      </Text>
    </View>
  );
}

export function ScannerOverlays({
  phase,
  errorReason,
  zoom,
  onZoomChange,
  flashlight,
  onFlashlightToggle,
  isPro,
  scanCount,
  scanLimit,
  onOpenPaywall,
  onCapture,
}: {
  phase: ScanPhase;
  errorReason: ScanErrorReason | null;
  zoom: number;
  onZoomChange: (val: number) => void;
  flashlight: boolean;
  onFlashlightToggle: () => void;
  isPro: boolean;
  scanCount: number;
  scanLimit: number;
  onOpenPaywall: () => void;
  onCapture: () => void;
}) {
  return (
    <>
      <ViewfinderControls
        zoom={zoom}
        onZoomChange={onZoomChange}
        flashlight={flashlight}
        onFlashlightToggle={onFlashlightToggle}
      />
      {phase !== "found" && (
        <ShutterButton phase={phase} onCapture={onCapture} />
      )}
      <ScanErrorBanner reason={errorReason} />
      {!isPro && (
        <LimitBanner
          count={scanCount}
          limit={scanLimit}
          onOpenPaywall={onOpenPaywall}
        />
      )}
    </>
  );
}

export function ViewfinderOverlay() {
  return (
    <View className="absolute inset-0">
      <View className="absolute inset-x-0 top-0 h-[30%] bg-black/45" />
      <View className="absolute inset-x-0 bottom-0 h-[40%] bg-black/45" />
      <View className="absolute top-[30%] bottom-[40%] left-0 w-[12%] bg-black/45" />
      <View className="absolute top-[30%] right-0 bottom-[40%] w-[12%] bg-black/45" />

      <View className="absolute top-[30%] right-[12%] bottom-[40%] left-[12%] items-center justify-center">
        <View className="absolute top-0 left-0 size-6 border-t-2 border-l-2 border-white" />
        <View className="absolute top-0 right-0 size-6 border-t-2 border-r-2 border-white" />
        <View className="absolute bottom-0 left-0 size-6 border-b-2 border-l-2 border-white" />
        <View className="absolute right-0 bottom-0 size-6 border-r-2 border-b-2 border-white" />
        <View className="h-0.5 w-[90%] bg-red/60 shadow-lg shadow-red-500/50" />
      </View>
    </View>
  );
}

export function ScanResultCard({
  scannedPrice,
  from,
  to,
  rates,
  decimalPlaces,
  getCurrencyInfo: resolveInfo,
  onDismiss,
}: {
  scannedPrice: number;
  from: string;
  to: string;
  rates: any;
  decimalPlaces: number;
  getCurrencyInfo: (code: string) => { name: string; flag: string };
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const rate = getExchangeRate({ from, to, rates, customRates: {} });
  const convertedVal = scannedPrice * rate;

  const fromInfo = resolveInfo(from);
  const toInfo = resolveInfo(to);

  return (
    <View className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] border-t border-line bg-surface p-6 shadow-2xl">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-extrabold text-ink">
          {t("converter.result")}
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          className="size-8 items-center justify-center rounded-full bg-chip"
        >
          <Text className="text-sm font-bold text-ink">✕</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <View className="flex-row items-center justify-between border-b border-line pb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl">{fromInfo.flag}</Text>
            <Text className="text-sm font-bold text-ink-mute">{from}</Text>
          </View>
          <Text className="text-lg font-bold text-ink">
            {scannedPrice.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl">{toInfo.flag}</Text>
            <Text className="text-base font-extrabold text-ink">{to}</Text>
          </View>
          <Text className="text-3xl font-black text-ink">
            {convertedVal.toFixed(decimalPlaces)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onDismiss}
        activeOpacity={0.8}
        className="mt-6 w-full items-center justify-center rounded-full bg-ink py-4"
      >
        <Text className="text-sm font-black tracking-widest text-bg uppercase">
          {t("converter.dismiss")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function CurrencyPickerModal({
  visible,
  onClose,
  onSelect,
  currencies,
  selectedCurrency,
  getCurrencyInfo: resolveInfo,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  currencies: string[];
  selectedCurrency: string;
  getCurrencyInfo: (code: string) => { name: string; flag: string };
}) {
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
          <ScrollView className="max-h-[300px]" showsVerticalScrollIndicator={false}>
            {currencies.map((code) => {
              const info = resolveInfo(code);
              const isSelected = code === selectedCurrency;
              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => onSelect(code)}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between rounded-xl p-3 ${
                    isSelected ? "bg-chip" : "bg-transparent"
                  }`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <Text className="text-lg">{info.flag}</Text>
                    <Text className="text-sm font-bold text-ink">{code}</Text>
                  </View>
                  {isSelected && <Text className="text-xs text-ink">✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function PermissionFallback({
  onBack,
  onRequestPermission,
}: {
  onBack: () => void;
  onRequestPermission: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <ScreenBackground className="flex-1 bg-bg">
      <View className="mb-4 h-[52px] flex-row items-center justify-between px-4 py-2">
        <View className="w-10 items-start">
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            className="size-10 items-center justify-center rounded-full border border-line bg-surface active:opacity-75"
            accessibilityLabel="Go back"
          >
            <BackIcon color={colors.ink} size={22} />
          </TouchableOpacity>
        </View>
        <Text className="flex-1 text-center text-[17px] font-extrabold text-ink" numberOfLines={1}>
          {t("converter.priceScanner")}
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 items-center justify-center px-6 pb-12">
        <View className="mb-6 size-20 items-center justify-center rounded-full bg-ink/5 dark:bg-ink/10">
          <CameraIcon color={colors.ink} size={36} />
        </View>

        <Text className="mb-3 text-center text-2xl font-black text-ink">
          {t("converter.cameraPermissionTitle")}
        </Text>

        <Text className="mb-8 text-center text-sm/relaxed font-semibold text-ink-mute">
          {t("converter.cameraPermissionText")}
        </Text>

        <View className="w-full max-w-[280px]">
          <TouchableOpacity
            onPress={onRequestPermission}
            activeOpacity={0.8}
            className="mb-3 w-full items-center justify-center rounded-full bg-ink py-4"
          >
            <Text className="text-sm font-black tracking-widest text-bg uppercase">
              {t("converter.allow")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.8}
            className="w-full items-center justify-center rounded-full border border-line bg-surface py-4"
          >
            <Text className="text-sm font-black tracking-widest text-ink-mute uppercase">
              {t("converter.dontAllow")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenBackground>
  );
}

function usePriceScannerState() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView>(null);

  const { baseCurrency, targetCurrencies } = useConverterStore();
  const { isPro, ocrScanAttempts, incrementScanAttempt } = useQuotaStore();
  const { data: currenciesData } = useCurrencies();
  const { rates } = useExchangeRates();
  const decimalPlaces = useSettingsStore(state => state.decimalPlaces);

  const [isPickerOpen, setIsPickerOpen] = React.useState<{ side: "from" | "to" } | null>(null);

  const selectableCurrencies = React.useMemo(
    () => [baseCurrency, ...targetCurrencies],
    [baseCurrency, targetCurrencies],
  );

  const captureFrame = React.useCallback(async () => {
    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.5,
      skipProcessing: true,
    });
    return photo?.uri ?? null;
  }, []);

  const engine = usePriceScannerEngine({
    initialFrom: baseCurrency,
    initialTo: targetCurrencies[0] ?? "EUR",
    captureFrame,
  });

  const { dismiss: engineDismiss } = engine;
  const enginePhase = engine.phase;

  // Quota guard: intercept the transition into "found".
  const prevPhaseRef = React.useRef(enginePhase);
  React.useEffect(() => {
    if (prevPhaseRef.current !== "found" && enginePhase === "found") {
      if (!isPro && ocrScanAttempts >= 3) {
        engineDismiss();
        router.push("/paywall");
      }
      else {
        incrementScanAttempt();
      }
    }
    prevPhaseRef.current = enginePhase;
  }, [enginePhase, isPro, ocrScanAttempts, incrementScanAttempt, router, engineDismiss]);

  return {
    cameraRef,
    permission,
    requestPermission,
    isPro,
    ocrScanAttempts,
    currenciesData,
    rates,
    decimalPlaces,
    isPickerOpen,
    setIsPickerOpen,
    selectableCurrencies,
    handleBack: router.back,
    handleOpenPaywall: () => router.push("/paywall"),
    engine,
  };
}

export default function PriceScannerScreen() {
  const state = usePriceScannerState();
  const colors = useThemeColors();

  if (state.permission === null) {
    return (
      <ScreenBackground className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color={colors.ink} />
      </ScreenBackground>
    );
  }

  if (!state.permission.granted) {
    return (
      <PermissionFallback
        onBack={state.handleBack}
        onRequestPermission={state.requestPermission}
      />
    );
  }

  return (
    <ScreenBackground className="flex-1 bg-black">
      <View className="relative flex-1">
        <CameraView
          ref={state.cameraRef}
          style={styles.camera}
          facing="back"
          zoom={state.engine.zoom}
          enableTorch={state.engine.flashlight}
        />

        <ViewfinderOverlay />

        <ScannerHeader
          isPro={state.isPro}
          onBack={state.handleBack}
          onOpenPaywall={state.handleOpenPaywall}
        />

        <CurrencySelectorBar
          from={state.engine.from}
          to={state.engine.to}
          onSwap={state.engine.swapCurrencies}
          onSelectBase={() => state.setIsPickerOpen({ side: "from" })}
          onSelectTarget={() => state.setIsPickerOpen({ side: "to" })}
          getCurrencyInfo={code => getCurrencyInfo(code, state.currenciesData)}
        />

        <ScannerOverlays
          phase={state.engine.phase}
          errorReason={state.engine.errorReason}
          zoom={state.engine.zoom}
          onZoomChange={state.engine.setZoom}
          flashlight={state.engine.flashlight}
          onFlashlightToggle={state.engine.toggleFlashlight}
          isPro={state.isPro}
          scanCount={state.ocrScanAttempts}
          scanLimit={3}
          onOpenPaywall={state.handleOpenPaywall}
          onCapture={state.engine.capture}
        />

        {state.engine.phase === "found" && state.engine.detectedPrice !== null && (
          <ScanResultCard
            scannedPrice={state.engine.detectedPrice}
            from={state.engine.from}
            to={state.engine.to}
            rates={state.rates}
            decimalPlaces={state.decimalPlaces}
            getCurrencyInfo={code => getCurrencyInfo(code, state.currenciesData)}
            onDismiss={state.engine.dismiss}
          />
        )}

        {state.isPickerOpen !== null && (
          <CurrencyPickerModal
            visible
            onClose={() => state.setIsPickerOpen(null)}
            onSelect={(code) => {
              if (state.isPickerOpen?.side === "from") {
                state.engine.setFrom(code);
              }
              else {
                state.engine.setTo(code);
              }
              state.setIsPickerOpen(null);
            }}
            currencies={state.selectableCurrencies}
            selectedCurrency={
              state.isPickerOpen?.side === "from" ? state.engine.from : state.engine.to
            }
            getCurrencyInfo={code => getCurrencyInfo(code, state.currenciesData)}
          />
        )}
      </View>
    </ScreenBackground>
  );
}
