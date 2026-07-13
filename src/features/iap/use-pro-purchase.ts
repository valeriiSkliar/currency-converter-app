import type { ProPlan } from "@/features/iap/plan-mapping";
import { ErrorCode, useIAP } from "expo-iap";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { showMessage } from "react-native-flash-message";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { mapSubscriptionsToPlans } from "@/features/iap/plan-mapping";
import { PRO_SKUS } from "@/features/iap/products";

type UseProPurchaseOptions = {
  onPurchaseComplete?: () => void;
};

type ProPurchaseApi = {
  isReady: boolean;
  plans: ProPlan[];
  isProcessing: boolean;
  purchase: (sku: string) => Promise<void>;
  restore: () => Promise<void>;
};

export function useProPurchase(options?: UseProPurchaseOptions): ProPurchaseApi {
  const { t } = useTranslation();
  const unlockPro = useQuotaStore(state => state.unlockPro);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const onCompleteRef = React.useRef(options?.onPurchaseComplete);
  onCompleteRef.current = options?.onPurchaseComplete;

  const {
    connected,
    fetchProducts,
    finishTransaction,
    hasActiveSubscriptions,
    requestPurchase,
    subscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await finishTransaction({ purchase, isConsumable: false });
      unlockPro();
      setIsProcessing(false);
      showMessage({ message: t("converter.purchaseSuccess"), type: "success" });
      onCompleteRef.current?.();
    },
    onPurchaseError: (error) => {
      setIsProcessing(false);
      if (error.code !== ErrorCode.UserCancelled) {
        showMessage({ message: t("converter.purchaseError"), type: "danger" });
      }
    },
  });

  React.useEffect(() => {
    if (connected) {
      fetchProducts({ skus: PRO_SKUS, type: "subs" }).catch(() => {});
    }
  }, [connected, fetchProducts]);

  const plans = React.useMemo(
    () => mapSubscriptionsToPlans(subscriptions),
    [subscriptions],
  );

  const purchase = React.useCallback(async (sku: string) => {
    setIsProcessing(true);
    const subscription = subscriptions.find(s => s.id === sku);
    // `subscriptionOffers` is the standardized, cross-platform offer list
    // (present on both the Android and iOS product variants), unlike the
    // deprecated Android-only `subscriptionOfferDetailsAndroid`. Each offer's
    // Android purchase token is typed as `offerTokenAndroid`.
    const subscriptionOffers = (subscription?.subscriptionOffers ?? [])
      .filter((offer): offer is typeof offer & { offerTokenAndroid: string } =>
        typeof offer.offerTokenAndroid === "string")
      .map(offer => ({ sku, offerToken: offer.offerTokenAndroid }));
    try {
      await requestPurchase({
        request: {
          apple: { sku },
          google: { skus: [sku], subscriptionOffers },
        },
        type: "subs",
      });
    }
    catch {
      setIsProcessing(false);
      showMessage({ message: t("converter.purchaseError"), type: "danger" });
    }
    // Success/definitive errors arrive via useIAP callbacks above.
  }, [requestPurchase, subscriptions, t]);

  const restore = React.useCallback(async () => {
    try {
      const hasActive = await hasActiveSubscriptions(PRO_SKUS);
      if (hasActive) {
        unlockPro();
        showMessage({ message: t("converter.restoreSuccess"), type: "success" });
      }
      else {
        showMessage({ message: t("converter.restoreNone"), type: "info" });
      }
    }
    catch {
      showMessage({ message: t("converter.purchaseError"), type: "danger" });
    }
  }, [hasActiveSubscriptions, t, unlockPro]);

  return {
    isReady: connected && plans.length > 0,
    plans,
    isProcessing,
    purchase,
    restore,
  };
}
