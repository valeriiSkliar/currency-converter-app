import * as React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { PlusIcon } from "@/components/ui/icons";
import { useThemeColors } from "@/components/ui/use-theme-colors";
import { TargetRow } from "./target-row";

type MultiListProps = {
  baseCurrency: string;
  targets: string[];
  getCurrencyInfo: (code: string) => { symbol: string; name: string };
  getConvertedText: (code: string) => string;
  getRateText: (code: string) => string;
  onPromote: (code: string) => void;
  onRemove: (code: string) => void;
  onAdd: () => void;
};

export function MultiList({
  baseCurrency,
  targets,
  getCurrencyInfo,
  getConvertedText,
  getRateText,
  onPromote,
  onRemove,
  onAdd,
}: MultiListProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View className="overflow-hidden rounded-[20px] border border-line bg-surface">
      {/* Empty State */}
      {targets.length === 0 && (
        <View className="items-center justify-center px-4 py-6">
          <Text className="text-center text-xs font-semibold text-ink-mute">
            {t("converter.tap_to_set_base")}
          </Text>
        </View>
      )}

      {/* Target Rows */}
      {targets.map((code, index) => {
        const info = getCurrencyInfo(code);
        return (
          <TargetRow
            key={code}
            code={code}
            symbol={info.symbol}
            baseCurrency={baseCurrency}
            rateText={getRateText(code)}
            convertedText={getConvertedText(code)}
            onPromote={() => onPromote(code)}
            onRemove={() => onRemove(code)}
            divider={index < targets.length - 1}
          />
        );
      })}

      {/* Add Currency Row Button */}
      <Pressable
        onPress={onAdd}
        className={`w-full flex-row items-center gap-2.5 px-4 py-3 active:opacity-75 ${
          targets.length > 0 ? "border-t border-dashed border-line-strong" : ""
        }`}
        accessibilityLabel={t("converter.add_currency")}
      >
        <View className="size-[30px] items-center justify-center rounded-full border border-line bg-chip text-ink">
          <PlusIcon color={colors.ink} size={16} />
        </View>
        <Text className="text-[13.5px] font-bold text-ink">
          {t("converter.add_currency")}
        </Text>
      </Pressable>
    </View>
  );
}
