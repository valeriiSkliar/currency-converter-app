import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export type RateModalProps = {
  visible: boolean;
  onClose: () => void;
  onSendFeedback?: () => void;
};

type StepData = {
  title: string;
  text: string;
  primaryLabel: string;
  secondaryLabel: string;
};

function getStepData(step: "ask" | "rate" | "feedback", t: (k: string) => string): StepData {
  if (step === "ask") {
    return {
      title: t("converter.likeAppTitle"),
      text: t("converter.likeAppSubtitle"),
      primaryLabel: t("converter.loveIt"),
      secondaryLabel: t("converter.notReally"),
    };
  }
  if (step === "rate") {
    return {
      title: t("converter.rateOnStoreTitle"),
      text: t("converter.rateOnStoreText"),
      primaryLabel: t("converter.rateNow"),
      secondaryLabel: t("converter.maybeLater"),
    };
  }
  return {
    title: t("converter.feedbackTitle"),
    text: t("converter.feedbackText"),
    primaryLabel: t("converter.sendFeedback"),
    secondaryLabel: t("converter.notNow"),
  };
}

export function RateModal({ visible, onClose, onSendFeedback }: RateModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = React.useState<"ask" | "rate" | "feedback">("ask");

  if (!visible) {
    return null;
  }

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("ask");
    }, 200);
  };

  const stepData = getStepData(step, t);

  const handlePrimaryPress = () => {
    if (step === "ask") {
      setStep("rate");
    }
    else if (step === "rate") {
      handleClose();
    }
    else {
      handleClose();
      if (onSendFeedback) {
        onSendFeedback();
      }
      else {
        router.push("/send-feedback");
      }
    }
  };

  const handleSecondaryPress = () => {
    if (step === "ask") {
      setStep("feedback");
    }
    else {
      handleClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 items-center justify-center bg-black/55 p-5" onPress={handleClose}>
        {/* Prevent click inside container from closing modal */}
        <Pressable className="w-full max-w-[325px] rounded-[26px] border border-line bg-surface p-[22px] shadow-2xl">
          {/* Emoji Medallion Header */}
          <EmojiMedallion step={step} />

          {/* Title */}
          <Text className="mt-3.5 text-xl/tight font-bold text-ink">
            {stepData.title}
          </Text>

          {/* Description */}
          <Text className="mt-2 text-[13.5px] leading-[1.45] text-ink-mute">
            {stepData.text}
          </Text>

          {/* Rating Emojis Row for Step "ask" */}
          {step === "ask" && (
            <View className="my-5 flex-row justify-center gap-3.5">
              <RateEmoji glyph="😕" onPress={handleSecondaryPress} />
              <RateEmoji glyph="😐" onPress={handleSecondaryPress} />
              <RateEmoji glyph="😊" onPress={handlePrimaryPress} />
              <RateEmoji glyph="😍" onPress={handlePrimaryPress} />
            </View>
          )}

          {/* Action Buttons */}
          <View className="mt-[18px] flex-row gap-2.5">
            {/* Secondary Option Button */}
            <TouchableOpacity
              onPress={handleSecondaryPress}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center rounded-full border border-line bg-chip py-3.5"
            >
              <Text className="text-sm font-bold text-ink">
                {stepData.secondaryLabel}
              </Text>
            </TouchableOpacity>

            {/* Primary Option Button */}
            <TouchableOpacity
              onPress={handlePrimaryPress}
              activeOpacity={0.8}
              className="flex-[1.2] items-center justify-center rounded-full bg-ink py-3.5"
            >
              <Text className="text-sm font-black text-bg">
                {stepData.primaryLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EmojiMedallion({ step, size = 56 }: { step: "ask" | "rate" | "feedback"; size?: number }) {
  const isFeedback = step === "feedback";

  // Choose emoji based on step
  const glyph = isFeedback ? "😕" : step === "rate" ? "🌟" : "👋";

  return (
    <View
      style={{ width: size, height: size }}
      className="shrink-0 items-center justify-center overflow-hidden rounded-[18px]"
    >
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <LinearGradient id="medGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={isFeedback ? "#6B6B6F" : "#FFD200"} />
            <Stop offset="100%" stopColor={isFeedback ? "#2A2A2E" : "#FF9F1C"} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#medGrad)" />
      </Svg>
      <Text className="text-[28px] leading-none">{glyph}</Text>
    </View>
  );
}

function RateEmoji({ glyph, onPress }: { glyph: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="size-12 items-center justify-center rounded-2xl border border-line bg-chip"
    >
      <Text className="text-[26px] leading-none">{glyph}</Text>
    </TouchableOpacity>
  );
}
