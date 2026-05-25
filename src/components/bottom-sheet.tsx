import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as React from "react";
import { useThemeConfig } from "@/components/ui/use-theme-config";

export type BottomSheetProps = {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
};

export function BottomSheet({ ref, children, snapPoints = ["50%"], onDismiss }: BottomSheetProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  const theme = useThemeConfig();

  const renderBackdrop = React.useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.dark ? "#131316" : "#FFFFFF",
      }}
      handleIndicatorStyle={{
        backgroundColor: theme.dark ? "#6B7077" : "#C9C9C9",
      }}
    >
      <BottomSheetView className="flex-1 p-6">
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

BottomSheet.displayName = "BottomSheet";
