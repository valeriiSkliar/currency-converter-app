import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { showMessage } from "react-native-flash-message";
import { FullscreenAd, ProLimitModal, RateModal, ScreenBackground } from "@/components/ui";
import {
  ArrowRight,
  BackIcon,
  GlobeIcon,
  MoonIcon,
  SunIcon,
  WallpaperIcon,
} from "@/components/ui/icons";
import { useThemeColors } from "@/components/ui/use-theme-colors";
import { PrivacyModal } from "@/features/converter/components/privacy-modal";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { useSelectedTheme } from "@/lib/hooks/use-selected-theme";
import { useSelectedLanguage } from "@/lib/i18n";

// Helper components split to keep function sizes below 110 physical lines limit

export function SettingsHeader({ onBack, title }: { onBack: () => void; title: string }) {
  const colors = useThemeColors();
  return (
    <View className="h-[52px] flex-row items-center justify-between border-b border-line px-1.5 py-2">
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        className="size-8 items-center justify-center rounded-full bg-transparent active:opacity-75"
        accessibilityLabel="Go back"
      >
        <BackIcon color={colors.ink} size={22} />
      </TouchableOpacity>
      <Text className="flex-1 px-2.5 text-[17px] font-extrabold text-ink" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="px-1.5 pt-4 pb-2 text-[10px] font-black tracking-widest text-ink-mute uppercase">
      {children}
    </Text>
  );
}

type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

export function SettingsRow({ icon, label, right, onPress }: SettingsRowProps) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-2 min-h-[60px] w-full flex-row items-center gap-3.5 rounded-[18px] border border-line bg-surface px-3.5 py-3"
    >
      <View className="size-9 items-center justify-center rounded-xl bg-chip text-ink">
        {icon}
      </View>
      <Text className="flex-1 text-[14.5px] font-bold text-ink">{label}</Text>
      {right}
    </Container>
  );
}

type SegmentedOption<T> = {
  id: T;
  label?: string;
  I?: React.ComponentType<{ color: string; size: number }>;
};

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (val: T) => void;
  options: SegmentedOption<T>[];
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row gap-0.5 rounded-full bg-chip p-[3px]">
      {options.map((o) => {
        const isSelected = o.id === value;
        return (
          <TouchableOpacity
            key={o.id}
            onPress={() => onChange(o.id)}
            activeOpacity={0.8}
            style={{ minWidth: 40, height: 28 }}
            className={`flex-row items-center justify-center rounded-full px-2.5 ${
              isSelected ? "bg-ink" : "bg-transparent"
            }`}
          >
            {o.I
              ? (
                  <o.I
                    color={
                      isSelected
                        ? colors.bg
                        : colors.inkMute
                    }
                    size={15}
                  />
                )
              : (
                  <Text
                    className={`text-xs font-bold tracking-tight ${
                      isSelected ? "text-bg" : "text-ink-mute"
                    }`}
                  >
                    {o.label}
                  </Text>
                )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function PrecisionSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [width, setWidth] = React.useState(0);
  const min = 2;
  const max = 10;
  const percentage = (value - min) / (max - min);

  const handleTouch = (evt: any) => {
    if (width <= 0) {
      return;
    }
    const x = evt.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / width));
    const newVal = Math.round(min + pct * (max - min));
    onChange(newVal);
  };

  return (
    <View
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
      className="relative h-6 w-full justify-center"
    >
      <View pointerEvents="none" className="h-1.5 w-full rounded-full bg-line" />
      <View
        pointerEvents="none"
        className="absolute h-1.5 rounded-full bg-ink"
        style={{ width: `${percentage * 100}%` }}
      />
      <View
        pointerEvents="none"
        className="absolute size-5 rounded-full border-2 border-surface bg-ink shadow-sm"
        style={{ left: `${percentage * 100}%`, marginLeft: -10 }}
      />
    </View>
  );
}

export function PrecisionCard({
  value,
  onChange,
  hint,
}: {
  value: number;
  onChange: (val: number) => void;
  hint: string;
}) {
  return (
    <View className="mb-2 rounded-[20px] border border-line bg-surface p-4">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[13px] text-ink-mute">{hint}</Text>
        <Text className="text-[28px] font-extrabold tracking-tighter text-ink">
          {value}
        </Text>
      </View>
      <View className="mt-3 flex-row items-center gap-2.5">
        <Text className="text-xs font-bold text-ink-soft">2</Text>
        <View className="flex-1">
          <PrecisionSlider value={value} onChange={onChange} />
        </View>
        <Text className="text-xs font-bold text-ink-soft">10</Text>
      </View>
    </View>
  );
}

type DevDebugPanelProps = {
  onTriggerRate: () => void;
  onTriggerPaywall: () => void;
  onTriggerProLimit: () => void;
  onTriggerPrivacy: () => void;
  onTriggerFullscreenAd: () => void;
  hint: string;
  triggers: Record<string, string>;
};

export function DevDebugPanel({
  onTriggerRate,
  onTriggerPaywall,
  onTriggerProLimit,
  onTriggerPrivacy,
  onTriggerFullscreenAd,
  hint,
  triggers,
}: DevDebugPanelProps) {
  return (
    <View className="mb-2 rounded-[20px] border border-dashed border-line bg-surface p-4">
      <Text className="mb-2.5 text-[10px] font-bold text-ink-soft uppercase">
        {hint}
      </Text>
      <View className="gap-2">
        <DevButton onPress={onTriggerRate} label={triggers.rate} />
        <DevButton onPress={onTriggerPaywall} label={triggers.paywall} />
        <DevButton onPress={onTriggerProLimit} label={triggers.proLimit} />
        <DevButton onPress={onTriggerPrivacy} label={triggers.privacy} />
        <DevButton onPress={onTriggerFullscreenAd} label={triggers.fullscreenAd} />
      </View>
    </View>
  );
}

function DevButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="w-full items-center justify-center rounded-xl border border-line bg-chip py-3 active:bg-chip/80"
    >
      <Text className="text-xs font-extrabold text-ink">{label}</Text>
    </TouchableOpacity>
  );
}

function useSettingsScreenState() {
  const router = useRouter();
  const { t } = useTranslation();

  const { decimalPlaces, setDecimalPlaces, setLanguage: setStoreLanguage } = useSettingsStore();
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const { language: currentLang, setLanguage: setI18nLanguage } = useSelectedLanguage();

  const [devTapCount, setDevTapCount] = React.useState(0);
  const [devModeEnabled, setDevModeEnabled] = React.useState(false);

  const [isProLimitVisible, setIsProLimitVisible] = React.useState(false);
  const [isPrivacyVisible, setIsPrivacyVisible] = React.useState(false);
  const [isRateVisible, setIsRateVisible] = React.useState(false);
  const [isAdVisible, setIsAdVisible] = React.useState(false);

  const handleLanguageChange = (lang: "en" | "ru" | "ar") => {
    setStoreLanguage(lang);
    setI18nLanguage(lang);
  };

  const handleVersionTap = () => {
    const nextCount = devTapCount + 1;
    setDevTapCount(nextCount);
    if (nextCount === 7) {
      setDevModeEnabled(true);
      showMessage({
        message: "Developer mode enabled!",
        type: "success",
        duration: 2000,
      });
    }
  };

  return {
    router,
    t,
    decimalPlaces,
    setDecimalPlaces,
    selectedTheme,
    setSelectedTheme,
    currentLang,
    handleLanguageChange,
    devModeEnabled,
    handleVersionTap,
    isProLimitVisible,
    setIsProLimitVisible,
    isPrivacyVisible,
    setIsPrivacyVisible,
    isRateVisible,
    setIsRateVisible,
    isAdVisible,
    setIsAdVisible,
  };
}

type SettingsState = ReturnType<typeof useSettingsScreenState>;

export function AppearanceSection({ state }: { state: SettingsState }) {
  const colors = useThemeColors();
  return (
    <View>
      <SectionLabel>{state.t("settings.appearance")}</SectionLabel>

      <SettingsRow
        icon={<SunIcon size={20} color={colors.ink} />}
        label={state.t("settings.theme.title")}
        right={(
          <Segmented
            value={state.selectedTheme}
            onChange={state.setSelectedTheme}
            options={[
              { id: "light", I: SunIcon },
              { id: "system", I: GlobeIcon },
              { id: "dark", I: MoonIcon },
            ]}
          />
        )}
      />

      <SettingsRow
        icon={<GlobeIcon size={20} color={colors.ink} />}
        label={state.t("settings.language")}
        right={(
          <Segmented
            value={state.currentLang || "en"}
            onChange={state.handleLanguageChange}
            options={[
              { id: "en", label: "EN" },
              { id: "ru", label: "RU" },
              { id: "ar", label: "AR" },
            ]}
          />
        )}
      />

      <SettingsRow
        icon={<WallpaperIcon size={20} color={colors.ink} />}
        label={state.t("settings.wallpaper")}
        onPress={() => {
          showMessage({
            message: state.t("settings.wallpaper"),
            description: state.t("settings.wallpaperHint"),
            type: "info",
            duration: 2000,
          });
        }}
        right={(
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[13px] font-semibold text-ink-mute">
              {state.t("settings.wallpaperHint")}
            </Text>
            <ArrowRight color={colors.inkMute} />
          </View>
        )}
      />
    </View>
  );
}

export function PrecisionSection({ state }: { state: SettingsState }) {
  return (
    <View>
      <SectionLabel>{state.t("settings.precision.title")}</SectionLabel>
      <PrecisionCard
        value={state.decimalPlaces}
        onChange={state.setDecimalPlaces}
        hint={state.t("settings.precisionHint")}
      />
    </View>
  );
}

export function DevSection({ state }: { state: SettingsState }) {
  if (!state.devModeEnabled) {
    return null;
  }
  return (
    <View>
      <SectionLabel>{state.t("settings.dev")}</SectionLabel>
      <DevDebugPanel
        hint={state.t("settings.devHint")}
        triggers={{
          rate: state.t("settings.rateTrigger"),
          paywall: state.t("settings.paywallTrigger"),
          proLimit: state.t("settings.proLimitTrigger"),
          privacy: state.t("settings.privacyTrigger"),
          fullscreenAd: state.t("settings.fullscreenAdTrigger"),
        }}
        onTriggerRate={() => state.setIsRateVisible(true)}
        onTriggerPaywall={() => state.router.push("/paywall")}
        onTriggerProLimit={() => state.setIsProLimitVisible(true)}
        onTriggerPrivacy={() => state.setIsPrivacyVisible(true)}
        onTriggerFullscreenAd={() => state.setIsAdVisible(true)}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const state = useSettingsScreenState();

  return (
    <ScreenBackground className="flex-1 bg-bg">
      <View className="flex-1 px-4 pb-4">
        <SettingsHeader onBack={() => state.router.back()} title={state.t("settings.title")} />

        <ScrollView className="mt-3 flex-1" showsVerticalScrollIndicator={false}>
          <AppearanceSection state={state} />
          <PrecisionSection state={state} />
          <DevSection state={state} />

          <TouchableOpacity
            onPress={state.handleVersionTap}
            activeOpacity={0.7}
            className="items-center justify-center py-6"
          >
            <Text className="text-xs font-bold text-ink-soft">v1.0.0</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ProLimitModal
        visible={state.isProLimitVisible}
        onClose={() => state.setIsProLimitVisible(false)}
        onUpgrade={() => {
          state.setIsProLimitVisible(false);
          state.router.push("/paywall");
        }}
        limit={4}
        count={4}
      />

      <PrivacyModal
        visible={state.isPrivacyVisible}
        onAccept={() => state.setIsPrivacyVisible(false)}
      />

      <RateModal
        visible={state.isRateVisible}
        onClose={() => state.setIsRateVisible(false)}
      />

      <FullscreenAd
        visible={state.isAdVisible}
        onClose={() => state.setIsAdVisible(false)}
      />
    </ScreenBackground>
  );
}
