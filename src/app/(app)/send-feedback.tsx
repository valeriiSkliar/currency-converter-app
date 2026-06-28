import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenBackground } from "@/components/ui";
import { BackIcon, CheckIcon } from "@/components/ui/icons";
import { useThemeColors } from "@/components/ui/use-theme-colors";
import { useSubmitFeedback } from "@/features/converter/api/use-feedback";

const FEEDBACK_OPTIONS = [
  { id: "opt1", translationKey: "converter.feedbackOpt1" },
  { id: "opt2", translationKey: "converter.feedbackOpt2" },
  { id: "opt3", translationKey: "converter.feedbackOpt3" },
  { id: "opt4", translationKey: "converter.feedbackOpt4" },
  { id: "opt5", translationKey: "converter.feedbackOpt5" },
  { id: "opt6", translationKey: "converter.feedbackOpt6" },
];

export function FeedbackHeader({
  onBack,
  title,
  sub,
}: {
  onBack: () => void;
  title: string;
  sub?: string;
}) {
  const colors = useThemeColors();
  return (
    <View className="mb-6 w-full">
      <View className="h-[52px] flex-row items-center justify-between py-2">
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
        <View className="flex-1" />
        <View className="w-10" />
      </View>
      <View className="mt-2 items-center px-4">
        <Text className="text-center text-2xl font-black text-ink">
          {title}
        </Text>
        {sub && (
          <Text className="mt-2 text-center text-sm font-semibold text-ink-mute">
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
}

export function RadioRow({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`mb-3 min-h-[60px] w-full flex-row items-center justify-between rounded-[18px] border bg-surface px-4 py-3.5 ${
        isSelected ? "border-ink" : "border-line"
      }`}
    >
      <Text className="mr-4 flex-1 text-[15px] font-bold text-ink">
        {label}
      </Text>
      <View
        className={`size-5 items-center justify-center rounded-full border-2 ${
          isSelected ? "border-ink bg-ink" : "border-line-strong bg-transparent"
        }`}
      >
        {isSelected && <View className="size-1.5 rounded-full bg-surface" />}
      </View>
    </TouchableOpacity>
  );
}

export function SuccessMedallion() {
  return (
    <View className="mb-6 size-20 items-center justify-center rounded-full border border-white/25 bg-linear-to-br from-[#FFE066] via-[#FFB100] to-[#FF8A00] shadow-md shadow-amber-500/30">
      <CheckIcon color="#FFFFFF" size={32} />
    </View>
  );
}

export function SubmitButton({
  disabled,
  onPress,
  label,
  isLoading,
}: {
  disabled: boolean;
  onPress: () => void;
  label: string;
  isLoading?: boolean;
}) {
  return (
    <TouchableOpacity
      disabled={disabled || isLoading}
      onPress={onPress}
      activeOpacity={0.8}
      className={`mt-4 w-full items-center justify-center rounded-full py-4.5 ${
        disabled || isLoading ? "bg-line" : "bg-ink active:opacity-90"
      }`}
    >
      {isLoading
        ? (
            <ActivityIndicator size="small" color="#888" />
          )
        : (
            <Text
              className={`text-sm font-black tracking-widest uppercase ${
                disabled ? "text-ink-soft/50" : "text-bg"
              }`}
            >
              {label}
            </Text>
          )}
    </TouchableOpacity>
  );
}

export default function SendFeedbackScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const { mutate: submitFeedback, isPending } = useSubmitFeedback();

  const handleSubmit = () => {
    if (!selectedOption) {
      return;
    }
    submitFeedback(
      { option_id: selectedOption },
      {
        onSuccess: () => setIsSubmitted(true),
        onError: () => {
          Alert.alert(
            t("common.error"),
            t("converter.feedbackError"),
          );
        },
      },
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleBackToApp = () => {
    router.replace("/(app)");
  };

  if (isSubmitted) {
    return (
      <ScreenBackground className="flex-1 bg-bg">
        <View className="flex-1 items-center justify-between px-4 pt-16 pb-6">
          <View className="flex-1 items-center justify-center px-4">
            <SuccessMedallion />
            <Text className="text-center text-2xl font-black text-ink">
              {t("converter.feedbackThanks")}
            </Text>
            <Text className="mt-3 text-center text-sm/relaxed font-semibold text-ink-mute">
              {t("converter.feedbackThanksSub")}
            </Text>
          </View>

          <SubmitButton
            disabled={false}
            onPress={handleBackToApp}
            label={t("converter.backToApp")}
          />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground className="flex-1 bg-bg">
      <View className="flex-1 px-4 pb-6">
        <FeedbackHeader
          onBack={handleBack}
          title={t("converter.feedbackScreenTitle")}
          sub={t("converter.feedbackScreenSubtitle")}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {FEEDBACK_OPTIONS.map(opt => (
            <RadioRow
              key={opt.id}
              label={t(opt.translationKey)}
              isSelected={selectedOption === opt.id}
              onPress={() => setSelectedOption(opt.id)}
            />
          ))}
        </ScrollView>

        <SubmitButton
          disabled={selectedOption === null}
          isLoading={isPending}
          onPress={handleSubmit}
          label={t("converter.submit")}
        />
      </View>
    </ScreenBackground>
  );
}
