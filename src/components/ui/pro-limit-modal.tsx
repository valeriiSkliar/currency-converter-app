import * as React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { CrownIcon } from "./icons/custom-icons";

export type ProLimitModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  limit: number;
  count: number;
  titleKey?: string;
  textKey?: string;
  counterKey?: string;
};

export function ProLimitModal({
  visible,
  onClose,
  onUpgrade,
  limit,
  count,
  titleKey = "converter.proLimitTitle",
  textKey = "converter.proLimitText",
  counterKey = "converter.proLimitCounter",
}: ProLimitModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 items-center justify-center bg-black/55 p-5" onPress={onClose}>
        {/* Prevent click inside container from closing modal */}
        <Pressable className="w-full max-w-[325px] rounded-[26px] border border-line bg-surface p-[22px] shadow-2xl">
          {/* Header Row */}
          <View className="mb-3.5 flex-row items-center gap-3.5">
            <CrownMedallion />
            <View className="min-w-0 flex-1">
              <Text className="text-lg leading-[1.15] font-bold text-ink">
                {t(titleKey)}
              </Text>
              <View className="mt-1.5 self-start rounded-full bg-amber-500/15 px-2 py-0.5">
                <Text className="text-[10px] font-black tracking-widest text-[#AA6A00] uppercase">
                  {t(counterKey, { count, limit })}
                </Text>
              </View>
            </View>
          </View>

          {/* Body Text */}
          <Text className="text-[13.5px] leading-[1.45] text-ink-mute">
            {t(textKey, { limit })}
          </Text>

          {/* Action Buttons */}
          <View className="mt-[18px] flex-row gap-2.5">
            {/* Cancel / Not now Button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center rounded-full border border-line bg-chip py-3.5"
            >
              <Text className="text-sm font-bold text-ink">
                {t("converter.continueFree")}
              </Text>
            </TouchableOpacity>

            {/* Upgrade Button */}
            <GradientButton
              onPress={onUpgrade}
              label={t("converter.upgradeToPro")}
              className="flex-[1.4]"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CrownMedallion({ size = 56 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }} className="shrink-0 items-center justify-center overflow-hidden rounded-[18px]">
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <LinearGradient id="crownMedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE066" />
            <Stop offset="60%" stopColor="#FFB100" />
            <Stop offset="100%" stopColor="#FF8A00" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#crownMedGrad)" />
      </Svg>
      <CrownIcon size={32} color="#1A1A1C" />
    </View>
  );
}

function GradientButton({
  onPress,
  label,
  className = "",
}: {
  onPress: () => void;
  label: string;
  className?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ elevation: 3 }}
    >
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <LinearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE066" />
            <Stop offset="60%" stopColor="#FFB100" />
            <Stop offset="100%" stopColor="#FF8A00" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#btnGrad)" />
      </Svg>
      <View className="items-center justify-center py-3.5">
        <Text className="text-sm font-black text-[#1A1A1C]">
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
