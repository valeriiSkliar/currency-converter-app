import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as React from "react";
import { useColors } from "@/lib/hooks";

export type BottomSheetProps = {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
};

export function BottomSheet({ ref, children, snapPoints = ["50%"], onDismiss }: BottomSheetProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  const colors = useColors();

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
        backgroundColor: colors.surface,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.lineStrong,
      }}
    >
      <BottomSheetView className="flex-1 p-6">
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

BottomSheet.displayName = "BottomSheet";
