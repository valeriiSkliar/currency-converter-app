import { useIAP } from "expo-iap";
import * as React from "react";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { PRO_SKUS } from "@/features/iap/products";

export function useProStatusSync(): void {
  const isPro = useQuotaStore(state => state.isPro);
  const revokePro = useQuotaStore(state => state.revokePro);
  const { connected, hasActiveSubscriptions } = useIAP();
  const checkedRef = React.useRef(false);

  React.useEffect(() => {
    if (!connected || !isPro || checkedRef.current) {
      return;
    }

    checkedRef.current = true;
    hasActiveSubscriptions(PRO_SKUS)
      .then((hasActive) => {
        if (!hasActive) {
          revokePro();
        }
      })
      .catch(() => {
        // A failed store check must not revoke the locally persisted status.
      });
  }, [connected, hasActiveSubscriptions, isPro, revokePro]);
}
