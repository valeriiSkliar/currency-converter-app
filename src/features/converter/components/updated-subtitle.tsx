import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type UpdatedSubtitleProps = {
  updatedAt: number | null;
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export function UpdatedSubtitle({ updatedAt, onRefresh, isRefreshing = false }: UpdatedSubtitleProps) {
  const { t } = useTranslation();
  const ago = useLastUpdated(updatedAt);

  return (
    <Pressable
      onPress={onRefresh}
      disabled={isRefreshing}
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-0.5 active:opacity-70"
      accessibilityLabel={t("converter.refresh")}
    >
      {/* Animated pulse dot or static dot */}
      <View
        className="size-2.5 rounded-full bg-accent"
        style={{
          shadowColor: "#FFD200",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 3,
          elevation: 2,
        }}
      />
      <Text className="text-xs font-semibold tracking-tight text-ink-mute">
        {isRefreshing
          ? t("common.loading")
          : `${t("converter.last_updated")} ${ago}`}
      </Text>
    </Pressable>
  );
}

function useLastUpdated(updatedAt: number | null) {
  const { t } = useTranslation();
  const [, forceUpdate] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(x => x + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!updatedAt) {
    return `—`;
  }

  const dt = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
  if (dt < 60) {
    return `${dt}${t("converter.sec_ago")}`;
  }
  return `${Math.floor(dt / 60)}${t("converter.min_ago")}`;
}
