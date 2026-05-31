import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useThemeColors } from "@/components/ui/use-theme-colors";

type AdBannerProps = {
  onRemove: () => void;
};

export function AdBanner({ onRemove }: AdBannerProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.surface2,
          borderColor: colors.lineStrong,
        },
      ]}
    >
      {/* Gradient Ad Icon */}
      <View style={styles.icon}>
        <Svg className="absolute inset-0" width="100%" height="100%">
          <Defs>
            <LinearGradient id="adGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#2A66C7" />
              <Stop offset="100%" stopColor="#7AC6FF" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#adGrad)" />
        </Svg>
        <Text style={styles.iconText}>Ad</Text>
      </View>

      {/* Ad Pitch Text */}
      <View style={styles.copy}>
        <Text
          style={[styles.title, { color: colors.ink }]}
          numberOfLines={1}
        >
          {t("converter.upgrade_pitch")}
        </Text>
        <Text style={[styles.meta, { color: colors.inkSoft }]} numberOfLines={1}>
          {t("converter.ad_label")}
          {" "}
          ·
          {t("converter.ad_label_admob")}
        </Text>
      </View>

      {/* Remove Button */}
      <Pressable
        onPress={onRemove}
        style={[styles.removeButton, { backgroundColor: colors.ink }]}
        accessibilityLabel={t("converter.ad_remove")}
      >
        <Text style={[styles.removeText, { color: colors.bg }]}>
          {t("converter.ad_remove")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 68,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: "100%",
  },
  copy: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  icon: {
    alignItems: "center",
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    overflow: "hidden",
    width: 42,
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  meta: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 4,
    textTransform: "uppercase",
  },
  removeButton: {
    alignItems: "center",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 18,
  },
  removeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
  },
});
