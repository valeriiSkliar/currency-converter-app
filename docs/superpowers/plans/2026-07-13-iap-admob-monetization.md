# Monetization v1 (expo-iap + AdMob interstitial) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake PRO purchase with real store subscriptions via `expo-iap`, remove unused ad mock elements, and back the fullscreen ad with a real AdMob interstitial.

**Architecture:** New feature module `src/features/iap/` wraps the `useIAP` hook from expo-iap; `useQuotaStore.isPro` stays the single source of PRO status, mutated only by the IAP layer. New module `src/features/ads/` holds pure frequency logic + a zustand store + an interstitial gate hook mounted in the app layout. Paywall screen stays presentational.

**Tech Stack:** Expo SDK 54, expo-iap (latest 4.x), react-native-google-mobile-ads (14+/16+), expo-tracking-transparency, Zustand, Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-07-13-iap-admob-monetization-design.md`

## Global Constraints

- SKUs (identical on both platforms): `pro_monthly`, `pro_yearly`. No lifetime product, no free trial anywhere in code or copy.
- Client-side validation only; no backend calls for purchases.
- Ads: fullscreen interstitial only. Threshold: every 5th significant action; min interval 3 minutes between shows; never on app open/exit. No ads at all when `isPro === true`.
- Imports use `@/` prefix; double quotes; named imports alphabetized; `max-lines-per-function` = 110.
- Translation catalogs `src/translations/{en,ru,ar}.json` must stay key-synchronized (ESLint i18n-json enforces this) — always edit all three together.
- Every task ends with `pnpm check-all` green and a commit.
- Native modules (expo-iap, google-mobile-ads) cannot run in Expo Go or Jest — Jest suites must rely on the module mocks added in this plan; on-device verification needs a new dev build (`pnpm prebuild && pnpm ios`), done once at the end.

---

### Task 1: Fix `pnpm check-all` (ignore `.cyrboard/`)

`check-all` currently fails only because the untracked `.cyrboard/worktrees/282/` repo copy is linted and its tests re-run.

**Files:**
- Modify: `eslint.config.mjs` (ignores array, ~line 29-45)
- Modify: `jest.config.js`

**Interfaces:**
- Produces: a green `pnpm check-all` baseline every later task depends on.

- [ ] **Step 1: Reproduce the failure**

Run: `pnpm check-all`
Expected: ESLint errors under `.cyrboard/…` and/or duplicated Jest suites from `.cyrboard/`.

- [ ] **Step 2: Add ignores**

In `eslint.config.mjs`, inside the existing `ignores` array add one entry:

```js
      ".cyrboard/",
```

In `jest.config.js`, add to the exported object (top level, after `testMatch`):

```js
  testPathIgnorePatterns: ["/node_modules/", "/.cyrboard/"],
  modulePathIgnorePatterns: ["<rootDir>/.cyrboard/"],
```

- [ ] **Step 3: Verify green**

Run: `pnpm check-all`
Expected: ESLint OK, type-check OK, translations OK, 19 suites / 156 tests pass, no `.cyrboard` paths in output.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs jest.config.js
git commit -m "chore: exclude .cyrboard worktrees from lint and tests"
```

---

### Task 2: Install expo-iap; add `revokePro()` to quota store

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `app.config.ts` (plugins array)
- Modify: `src/features/converter/store/use-quota-store.ts`
- Test: `src/__tests__/quota-store.test.ts`

**Interfaces:**
- Produces: `useQuotaStore.getState().revokePro(): void` — sets `isPro` to `false`. Used by Task 5.
- Produces: installed `expo-iap` package used by Tasks 3–5.

- [ ] **Step 1: Install expo-iap**

Run: `pnpm add expo-iap`
Expected: latest 4.x added to dependencies.

- [ ] **Step 2: Register the config plugin (if the package ships one)**

Run: `node -e "console.log(require.resolve('expo-iap/app.plugin.js'))"`
If it resolves, add to the `plugins` array in `app.config.ts` (after `["react-native-edge-to-edge"]`):

```ts
    "expo-iap",
```

If it does not resolve (older stable versions need no plugin — Android billing permission ships in the library manifest), skip this step.

- [ ] **Step 3: Write the failing test**

Append to the existing describe block in `src/__tests__/quota-store.test.ts` (follow the file's existing reset pattern):

```ts
  it("revokePro sets isPro back to false", () => {
    useQuotaStore.getState().unlockPro();
    expect(useQuotaStore.getState().isPro).toBe(true);

    useQuotaStore.getState().revokePro();
    expect(useQuotaStore.getState().isPro).toBe(false);
  });
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test quota-store -- -t "revokePro"`
Expected: FAIL — `revokePro is not a function`.

- [ ] **Step 5: Implement `revokePro`**

In `src/features/converter/store/use-quota-store.ts`:

Add to the `QuotaState` type after `unlockPro: () => void;`:

```ts
  revokePro: () => void;
```

Add to the store creator after `unlockPro: () => set({ isPro: true }),`:

```ts
      revokePro: () => set({ isPro: false }),
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test quota-store`
Expected: PASS (all cases).

- [ ] **Step 7: check-all and commit**

Run: `pnpm check-all` → green.

```bash
git add package.json pnpm-lock.yaml app.config.ts src/features/converter/store/use-quota-store.ts src/__tests__/quota-store.test.ts
git commit -m "feat(iap): install expo-iap and add revokePro action to quota store"
```

---

### Task 3: IAP product constants and pure plan mapping

**Files:**
- Create: `src/features/iap/products.ts`
- Create: `src/features/iap/plan-mapping.ts`
- Test: `src/__tests__/iap-plan-mapping.test.ts`

**Interfaces:**
- Produces: `PRO_SKU_MONTHLY = "pro_monthly"`, `PRO_SKU_YEARLY = "pro_yearly"`, `PRO_SKUS: string[]`.
- Produces: `mapSubscriptionsToPlans(subs: StoreSubscription[]): ProPlan[]` where

```ts
type StoreSubscription = { id: string; displayPrice: string; price?: number | null };
type ProPlan = {
  sku: string;
  period: "monthly" | "yearly";
  displayPrice: string;
  savingsPercent: number | null; // on yearly vs 12× monthly, else null
};
```

Consumed by Task 4 (hook) and Task 6 (paywall UI).

- [ ] **Step 1: Write `products.ts`**

```ts
export const PRO_SKU_MONTHLY = "pro_monthly";
export const PRO_SKU_YEARLY = "pro_yearly";

export const PRO_SKUS = [PRO_SKU_MONTHLY, PRO_SKU_YEARLY];
```

- [ ] **Step 2: Write the failing tests**

Create `src/__tests__/iap-plan-mapping.test.ts`:

```ts
import { mapSubscriptionsToPlans } from "@/features/iap/plan-mapping";

const monthly = { id: "pro_monthly", displayPrice: "$4.99", price: 4.99 };
const yearly = { id: "pro_yearly", displayPrice: "$19.99", price: 19.99 };

describe("mapSubscriptionsToPlans", () => {
  it("returns monthly first, then yearly, regardless of input order", () => {
    const plans = mapSubscriptionsToPlans([yearly, monthly]);
    expect(plans.map(p => p.sku)).toEqual(["pro_monthly", "pro_yearly"]);
    expect(plans.map(p => p.period)).toEqual(["monthly", "yearly"]);
  });

  it("keeps the store's localized displayPrice", () => {
    const plans = mapSubscriptionsToPlans([monthly, yearly]);
    expect(plans[0].displayPrice).toBe("$4.99");
    expect(plans[1].displayPrice).toBe("$19.99");
  });

  it("computes yearly savings vs 12x monthly (rounded)", () => {
    const plans = mapSubscriptionsToPlans([monthly, yearly]);
    // 1 - 19.99 / (4.99 * 12) = 0.666… → 67
    expect(plans[1].savingsPercent).toBe(67);
    expect(plans[0].savingsPercent).toBeNull();
  });

  it("returns null savings when a numeric price is missing", () => {
    const plans = mapSubscriptionsToPlans([
      { id: "pro_monthly", displayPrice: "$4.99", price: null },
      yearly,
    ]);
    expect(plans[1].savingsPercent).toBeNull();
  });

  it("ignores unknown SKUs and tolerates missing products", () => {
    const plans = mapSubscriptionsToPlans([
      { id: "other_sku", displayPrice: "$1.00", price: 1 },
      monthly,
    ]);
    expect(plans.map(p => p.sku)).toEqual(["pro_monthly"]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test iap-plan-mapping`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `plan-mapping.ts`**

```ts
import { PRO_SKU_MONTHLY, PRO_SKU_YEARLY } from "@/features/iap/products";

export type StoreSubscription = {
  id: string;
  displayPrice: string;
  price?: number | null;
};

export type ProPlan = {
  sku: string;
  period: "monthly" | "yearly";
  displayPrice: string;
  savingsPercent: number | null;
};

function yearlySavingsPercent(
  monthly: StoreSubscription | undefined,
  yearly: StoreSubscription,
): number | null {
  if (!monthly || typeof monthly.price !== "number" || typeof yearly.price !== "number") {
    return null;
  }
  const fullYear = monthly.price * 12;
  if (fullYear <= 0 || yearly.price >= fullYear) {
    return null;
  }
  return Math.round((1 - yearly.price / fullYear) * 100);
}

export function mapSubscriptionsToPlans(subs: StoreSubscription[]): ProPlan[] {
  const monthly = subs.find(s => s.id === PRO_SKU_MONTHLY);
  const yearly = subs.find(s => s.id === PRO_SKU_YEARLY);

  const plans: ProPlan[] = [];
  if (monthly) {
    plans.push({
      sku: monthly.id,
      period: "monthly",
      displayPrice: monthly.displayPrice,
      savingsPercent: null,
    });
  }
  if (yearly) {
    plans.push({
      sku: yearly.id,
      period: "yearly",
      displayPrice: yearly.displayPrice,
      savingsPercent: yearlySavingsPercent(monthly, yearly),
    });
  }
  return plans;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test iap-plan-mapping`
Expected: PASS (5 tests).

- [ ] **Step 6: check-all and commit**

```bash
git add src/features/iap src/__tests__/iap-plan-mapping.test.ts
git commit -m "feat(iap): add product SKUs and pure subscription-to-plan mapping"
```

---

### Task 4: `useProPurchase` hook (purchase + restore)

**Files:**
- Create: `src/features/iap/use-pro-purchase.ts`
- Test: `src/__tests__/use-pro-purchase.test.tsx`

**Interfaces:**
- Consumes: `useIAP` from `expo-iap`; `PRO_SKUS` and `mapSubscriptionsToPlans` from Task 3; `unlockPro` from quota store.
- Produces (consumed by Task 6):

```ts
function useProPurchase(options?: { onPurchaseComplete?: () => void }): {
  isReady: boolean;          // connected && plans fetched
  plans: ProPlan[];
  isProcessing: boolean;     // purchase in flight — disable CTA
  purchase: (sku: string) => Promise<void>;
  restore: () => Promise<void>;
};
```

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/use-pro-purchase.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react-native";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { useProPurchase } from "@/features/iap/use-pro-purchase";

const mockShowMessage = jest.fn();
jest.mock("react-native-flash-message", () => ({
  showMessage: (...args: unknown[]) => mockShowMessage(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockRequestPurchase = jest.fn(() => Promise.resolve());
const mockFinishTransaction = jest.fn(() => Promise.resolve());
const mockFetchProducts = jest.fn(() => Promise.resolve());
const mockGetActiveSubscriptions = jest.fn(() => Promise.resolve([] as unknown[]));

let capturedOptions: {
  onPurchaseSuccess?: (purchase: unknown) => void | Promise<void>;
  onPurchaseError?: (error: { code: string; message: string }) => void;
} = {};

jest.mock("expo-iap", () => ({
  ErrorCode: { UserCancelled: "user-cancelled" },
  useIAP: (options: typeof capturedOptions) => {
    capturedOptions = options;
    return {
      connected: true,
      subscriptions: [
        { id: "pro_monthly", displayPrice: "$4.99", price: 4.99 },
        { id: "pro_yearly", displayPrice: "$19.99", price: 19.99 },
      ],
      fetchProducts: mockFetchProducts,
      requestPurchase: mockRequestPurchase,
      finishTransaction: mockFinishTransaction,
      getActiveSubscriptions: mockGetActiveSubscriptions,
    };
  },
}));

describe("useProPurchase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQuotaStore.setState({ isPro: false });
  });

  it("fetches subscription products once connected", () => {
    renderHook(() => useProPurchase());
    expect(mockFetchProducts).toHaveBeenCalledWith({
      skus: ["pro_monthly", "pro_yearly"],
      type: "subs",
    });
  });

  it("exposes mapped plans and readiness", () => {
    const { result } = renderHook(() => useProPurchase());
    expect(result.current.isReady).toBe(true);
    expect(result.current.plans.map(p => p.sku)).toEqual([
      "pro_monthly",
      "pro_yearly",
    ]);
  });

  it("purchase() requests the subscription and flags processing", async () => {
    const { result } = renderHook(() => useProPurchase());
    await act(async () => {
      await result.current.purchase("pro_yearly");
    });
    expect(result.current.isProcessing).toBe(true);
    expect(mockRequestPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ type: "subs" }),
    );
  });

  it("unlocks PRO and finishes transaction on purchase success", async () => {
    const onPurchaseComplete = jest.fn();
    renderHook(() => useProPurchase({ onPurchaseComplete }));
    await act(async () => {
      await capturedOptions.onPurchaseSuccess?.({ productId: "pro_yearly" });
    });
    expect(mockFinishTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ isConsumable: false }),
    );
    expect(useQuotaStore.getState().isPro).toBe(true);
    expect(onPurchaseComplete).toHaveBeenCalled();
  });

  it("stays silent when the user cancels", async () => {
    renderHook(() => useProPurchase());
    await act(async () => {
      capturedOptions.onPurchaseError?.({ code: "user-cancelled", message: "x" });
    });
    expect(mockShowMessage).not.toHaveBeenCalled();
    expect(useQuotaStore.getState().isPro).toBe(false);
  });

  it("shows an error message for real purchase errors", async () => {
    renderHook(() => useProPurchase());
    await act(async () => {
      capturedOptions.onPurchaseError?.({ code: "unknown", message: "boom" });
    });
    expect(mockShowMessage).toHaveBeenCalled();
    expect(useQuotaStore.getState().isPro).toBe(false);
  });

  it("restore() unlocks PRO when an active subscription exists", async () => {
    mockGetActiveSubscriptions.mockResolvedValueOnce([{ productId: "pro_monthly" }]);
    const { result } = renderHook(() => useProPurchase());
    await act(async () => {
      await result.current.restore();
    });
    expect(useQuotaStore.getState().isPro).toBe(true);
  });

  it("restore() reports when nothing is found and does not unlock", async () => {
    mockGetActiveSubscriptions.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useProPurchase());
    await act(async () => {
      await result.current.restore();
    });
    expect(useQuotaStore.getState().isPro).toBe(false);
    expect(mockShowMessage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test use-pro-purchase`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/features/iap/use-pro-purchase.ts`:

```ts
import { ErrorCode, useIAP } from "expo-iap";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { showMessage } from "react-native-flash-message";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { mapSubscriptionsToPlans, type ProPlan } from "@/features/iap/plan-mapping";
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
    getActiveSubscriptions,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const plans = React.useMemo(
    () => mapSubscriptionsToPlans(subscriptions),
    [subscriptions],
  );

  const purchase = React.useCallback(async (sku: string) => {
    setIsProcessing(true);
    const subscription = subscriptions.find(s => s.id === sku);
    const subscriptionOffers
      = subscription?.subscriptionOfferDetailsAndroid?.map(offer => ({
        sku,
        offerToken: offer.offerToken,
      })) ?? [];
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
      const active = await getActiveSubscriptions(PRO_SKUS);
      if (active.length > 0) {
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
  }, [getActiveSubscriptions, t, unlockPro]);

  return {
    isReady: connected && plans.length > 0,
    plans,
    isProcessing,
    purchase,
    restore,
  };
}
```

Note: if the installed expo-iap version types `subscriptionOfferDetailsAndroid` differently (check `node_modules/expo-iap/build` types), adjust the field name to the typed one — the test does not pin it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test use-pro-purchase`
Expected: PASS (8 tests).

- [ ] **Step 5: check-all and commit**

```bash
git add src/features/iap/use-pro-purchase.ts src/__tests__/use-pro-purchase.test.tsx
git commit -m "feat(iap): add useProPurchase hook with purchase and restore flows"
```

---

### Task 5: PRO status sync on app start

**Files:**
- Create: `src/features/iap/use-pro-status-sync.ts`
- Modify: `src/app/(app)/_layout.tsx`
- Test: `src/__tests__/use-pro-status-sync.test.tsx`

**Interfaces:**
- Consumes: `useIAP().hasActiveSubscriptions` (hook-level `getActiveSubscriptions` returns `Promise<void>` in expo-iap 4.4.1 — verified in Task 4), `PRO_SKUS`, `useQuotaStore.revokePro` (Task 2).
- Produces: `useProStatusSync(): void` — mounted once in the app layout.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/use-pro-status-sync.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react-native";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { useProStatusSync } from "@/features/iap/use-pro-status-sync";

const mockHasActiveSubscriptions = jest.fn(() => Promise.resolve(false));

jest.mock("expo-iap", () => ({
  useIAP: () => ({
    connected: true,
    hasActiveSubscriptions: mockHasActiveSubscriptions,
  }),
}));

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useProStatusSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revokes PRO when the store reports no active subscription", async () => {
    useQuotaStore.setState({ isPro: true });
    renderHook(() => useProStatusSync());
    await flush();
    expect(useQuotaStore.getState().isPro).toBe(false);
  });

  it("keeps PRO when an active subscription exists", async () => {
    mockHasActiveSubscriptions.mockResolvedValueOnce(true);
    useQuotaStore.setState({ isPro: true });
    renderHook(() => useProStatusSync());
    await flush();
    expect(useQuotaStore.getState().isPro).toBe(true);
  });

  it("keeps PRO when the store check fails (offline)", async () => {
    mockHasActiveSubscriptions.mockRejectedValueOnce(new Error("offline"));
    useQuotaStore.setState({ isPro: true });
    renderHook(() => useProStatusSync());
    await flush();
    expect(useQuotaStore.getState().isPro).toBe(true);
  });

  it("does nothing for free users", async () => {
    useQuotaStore.setState({ isPro: false });
    renderHook(() => useProStatusSync());
    await flush();
    expect(mockHasActiveSubscriptions).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test use-pro-status-sync`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/features/iap/use-pro-status-sync.ts`:

```ts
import { useIAP } from "expo-iap";
import * as React from "react";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { PRO_SKUS } from "@/features/iap/products";

// One check per app launch: if the store says there is no active
// subscription, the locally persisted PRO flag is stale — revoke it.
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
        // Offline / store error: keep the current status.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, isPro]);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test use-pro-status-sync`
Expected: PASS (4 tests).

- [ ] **Step 5: Mount in the app layout**

In `src/app/(app)/_layout.tsx`:

```ts
import { useProStatusSync } from "@/features/iap/use-pro-status-sync";
```

Inside `AppLayout()`, first line of the body:

```ts
  useProStatusSync();
```

- [ ] **Step 6: Full test run, check-all, commit**

Run: `pnpm check-all`
Expected: green. If suites rendering the app layout now fail on the unmocked `expo-iap` native module, add a global mock at the end of `jest-setup.ts`:

```ts
// Mock expo-iap (native module unavailable in Jest)
jest.mock("expo-iap", () => ({
  ErrorCode: { UserCancelled: "user-cancelled" },
  useIAP: () => ({
    connected: false,
    subscriptions: [],
    fetchProducts: jest.fn(),
    requestPurchase: jest.fn(),
    finishTransaction: jest.fn(),
    hasActiveSubscriptions: jest.fn(() => Promise.resolve(false)),
  }),
}));
```

(Per-file `jest.mock` calls in the Task 4/5 tests override this global mock.)

```bash
git add src/features/iap/use-pro-status-sync.ts src/__tests__/use-pro-status-sync.test.tsx "src/app/(app)/_layout.tsx" jest-setup.ts
git commit -m "feat(iap): revoke stale PRO status on launch via store check"
```

---

### Task 6: Wire paywall to real purchases; drop Lifetime and trial copy

**Files:**
- Modify: `src/app/(app)/paywall.tsx`
- Modify: `src/translations/en.json`, `src/translations/ru.json`, `src/translations/ar.json`

**Interfaces:**
- Consumes: `useProPurchase` (Task 4), `ProPlan` (Task 3).
- Produces: paywall with store-driven plans; `CTADock` gains an `onRestore` prop.

- [ ] **Step 1: Update translations (all three files together)**

In `src/translations/en.json` (`converter` section) — remove keys `planLifetime`, `priceOnce`, `save60`, `trialNote`; add:

```json
    "paywallNote": "Auto-renews · cancel anytime",
    "plansLoading": "Loading plans…",
    "purchaseError": "Purchase failed. Please try again.",
    "purchaseSuccess": "You are now a PRO member. Thank you!",
    "restoreNone": "No active purchases found",
    "restoreSuccess": "Purchases restored — PRO is active",
    "savePercent": "Save {{percent}}%",
```

In `src/translations/ru.json` — remove the same keys; add:

```json
    "paywallNote": "Автопродление · отмена в любое время",
    "plansLoading": "Загрузка тарифов…",
    "purchaseError": "Не удалось выполнить покупку. Попробуйте ещё раз.",
    "purchaseSuccess": "PRO активирован. Спасибо!",
    "restoreNone": "Активных покупок не найдено",
    "restoreSuccess": "Покупки восстановлены — PRO активен",
    "savePercent": "Экономия {{percent}}%",
```

In `src/translations/ar.json` — remove the same keys; add:

```json
    "paywallNote": "تجديد تلقائي · يمكنك الإلغاء في أي وقت",
    "plansLoading": "جارٍ تحميل الباقات…",
    "purchaseError": "فشلت عملية الشراء. حاول مرة أخرى.",
    "purchaseSuccess": "أصبحت الآن عضو PRO. شكرًا لك!",
    "restoreNone": "لم يتم العثور على مشتريات نشطة",
    "restoreSuccess": "تمت استعادة المشتريات — PRO مفعّل",
    "savePercent": "توفير {{percent}}٪",
```

Keep keys alphabetically ordered within the section if the file already is.

- [ ] **Step 2: Rewrite `usePaywallScreenState` in `src/app/(app)/paywall.tsx`**

Replace imports: drop `showMessage` (moved into the hook); add:

```ts
import { useProPurchase } from "@/features/iap/use-pro-purchase";
import { PRO_SKU_YEARLY } from "@/features/iap/products";
```

Replace the whole `usePaywallScreenState` function with:

```ts
function usePaywallScreenState() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = React.useState(PRO_SKU_YEARLY);

  const { isReady, plans: storePlans, isProcessing, purchase, restore }
    = useProPurchase({ onPurchaseComplete: () => router.back() });

  const features = [
    t("converter.featureNoAds"),
    t("converter.featureUnlimited"),
    t("converter.featurePrecision"),
    t("converter.featureWidgets"),
    t("converter.featureWallpapers"),
    t("converter.featureSync"),
  ];

  const plans = storePlans.map(plan => ({
    id: plan.sku,
    title: t(plan.period === "monthly" ? "converter.planMonthly" : "converter.planYearly"),
    price: plan.displayPrice,
    per: t(plan.period === "monthly" ? "converter.pricePerMonth" : "converter.pricePerYear"),
    sub: plan.savingsPercent === null
      ? ""
      : t("converter.savePercent", { percent: plan.savingsPercent }),
    badge: plan.period === "yearly" ? t("converter.bestValue") : undefined,
  }));

  const handlePurchase = () => {
    if (!isReady || isProcessing) {
      return;
    }
    void purchase(selectedPlan);
  };

  return {
    router,
    t,
    selectedPlan,
    setSelectedPlan,
    features,
    plans,
    isReady,
    isProcessing,
    handlePurchase,
    handleRestore: () => void restore(),
  };
}
```

- [ ] **Step 3: Update `CTADock` and the screen**

`CTADock` changes:
- add props `onRestore: () => void` and `disabled?: boolean`;
- the restore `TouchableOpacity` calls `onRestore` (not `onBack`); the terms one keeps `onBack`;
- the CTA `TouchableOpacity` gets `disabled={disabled}` and, when disabled, renders `<ActivityIndicator color="#1A1A1C" />` instead of the text (import `ActivityIndicator` from `react-native`).

Screen (`PaywallScreen`) changes:
- plans area: when `!isReady`, render a centered `<ActivityIndicator color="#FFD200" />` with `t("converter.plansLoading")` text instead of the plan cards;
- `CTADock` call becomes:

```tsx
      <CTADock
        ctaText={t("converter.paywallCta")}
        trialNote={t("converter.paywallNote")}
        restoreText={t("converter.restorePurchase")}
        termsText={t("converter.termsAndPrivacy")}
        disabled={!isReady || isProcessing}
        onPress={handlePurchase}
        onRestore={handleRestore}
        onBack={() => router.back()}
        bottomInset={insets.bottom}
      />
```

(Renaming the `trialNote` prop to `note` is optional; if renamed, rename it consistently within this file.)

- [ ] **Step 4: Verify**

Run: `pnpm check-all`
Expected: green — including the i18n key-sync lint across en/ru/ar.

Manual (simulator or existing dev build without new natives — plans will stay in loading state since the store is unreachable; that is the expected degraded behavior): open paywall from drawer → loading indicator shown, CTA disabled, no Lifetime card, no trial text.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/paywall.tsx" src/translations
git commit -m "feat(iap): drive paywall from real store subscriptions, drop lifetime and trial copy"
```

---

### Task 7: Remove the home-screen ad banner and the drawer "remove ads" offer

**Files:**
- Delete: `src/features/converter/components/ad-banner.tsx`
- Modify: `src/app/(app)/index.tsx` (import line 11, block lines 92-97, `adSlot` style ~line 253)
- Modify: `src/components/drawer-menu.tsx` (button lines 109-120, `onRemoveAds` prop)
- Modify: `src/app/(app)/_layout.tsx` (`handleRemoveAds`, prop pass)
- Modify: `src/translations/{en,ru,ar}.json` (drop `drawer.remove_ads`)

**Interfaces:**
- Produces: no ad-banner component anywhere; `DrawerMenu`/`DrawerContent` props no longer include `onRemoveAds`.

- [ ] **Step 1: Delete the banner component and its usage**

```bash
git rm src/features/converter/components/ad-banner.tsx
```

In `src/app/(app)/index.tsx`:
- remove the import `import { AdBanner } from "@/features/converter/components/ad-banner";`
- remove the block:

```tsx
        {/* Sponsored Ad Banner */}
        {!isPro && (
          <View style={homeStyles.adSlot}>
            <AdBanner onRemove={() => router.push("/paywall")} />
          </View>
        )}
```

- remove the now-unused `adSlot` entry from `homeStyles`. If `isPro` or `router` become unused in this component after the removal, remove those too (check with lint).

- [ ] **Step 2: Remove the drawer offer**

In `src/components/drawer-menu.tsx`:
- delete the `{/* Monetization Yellow Button */}` block (the `!isPro &&` TouchableOpacity with `t("drawer.remove_ads")`);
- remove `onRemoveAds` from `DrawerContentProps`, the `DrawerContent` parameters, and the `DrawerMenu` wrapper (check the bottom of the file for the wrapper's props and pass-through);
- if `isPro` is still used elsewhere in the file (the header plan label uses it), keep it.

In `src/app/(app)/_layout.tsx`:
- delete the `handleRemoveAds` function;
- delete `onRemoveAds={handleRemoveAds}` from the `<DrawerMenu …/>` JSX.

- [ ] **Step 3: Remove the translation key**

Delete the `"remove_ads"` line from the `drawer` section of `src/translations/en.json`, `ru.json`, and `ar.json`.

- [ ] **Step 4: Verify and commit**

Run: `pnpm check-all`
Expected: green — no unused-variable errors, i18n keys in sync.

Manual: home screen shows currency list directly above the numpad (no banner slot); drawer has no yellow button.

```bash
git add -A
git commit -m "feat: remove home ad banner and drawer remove-ads offer"
```

---

### Task 8: Install AdMob + tracking transparency; env plumbing

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `app.config.ts` (plugins)
- Modify: `env.ts` (optional interstitial unit IDs)
- Create: `src/features/ads/ad-unit-ids.ts`
- Modify: `jest-setup.ts` (global mocks)

**Interfaces:**
- Produces: `getInterstitialAdUnitId(): string` — Google test ID outside production or when env IDs are absent. Consumed by Task 10.

- [ ] **Step 1: Install packages**

Run: `pnpm add react-native-google-mobile-ads expo-tracking-transparency`

- [ ] **Step 2: Config plugins in `app.config.ts`**

Append to the `plugins` array:

```ts
    [
      "react-native-google-mobile-ads",
      {
        // Google sample app IDs until real AdMob apps exist (see spec prerequisites)
        androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? "ca-app-pub-3940256099942544~3347511713",
        iosAppId: process.env.ADMOB_IOS_APP_ID ?? "ca-app-pub-3940256099942544~1458002511",
      },
    ],
    [
      "expo-tracking-transparency",
      {
        userTrackingPermission:
          "This identifier will be used to show you more relevant ads.",
      },
    ],
```

- [ ] **Step 3: Env additions in `env.ts`**

Schema — add after `EXPO_PUBLIC_RATE_URL_ANDROID`:

```ts
  EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS: z.string().optional(),
  EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID: z.string().optional(),
```

`_env` object — add after `EXPO_PUBLIC_RATE_URL_ANDROID: …`:

```ts
  EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS,
  EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID,
```

- [ ] **Step 4: Unit-id helper**

Create `src/features/ads/ad-unit-ids.ts`:

```ts
import Env from "env";
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

export function getInterstitialAdUnitId(): string {
  if (Env.EXPO_PUBLIC_APP_ENV !== "production") {
    return TestIds.INTERSTITIAL;
  }
  const realId = Platform.select({
    android: Env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID,
    ios: Env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS,
  });
  return realId ?? TestIds.INTERSTITIAL;
}
```

- [ ] **Step 5: Global Jest mocks**

Append to `jest-setup.ts`:

```ts
// Mock react-native-google-mobile-ads (native module unavailable in Jest)
jest.mock("react-native-google-mobile-ads", () => ({
  __esModule: true,
  default: () => ({ initialize: jest.fn(() => Promise.resolve([])) }),
  TestIds: { INTERSTITIAL: "test-interstitial" },
  AdsConsent: { gatherConsent: jest.fn(() => Promise.resolve()) },
  useInterstitialAd: () => ({
    isLoaded: false,
    isClosed: false,
    load: jest.fn(),
    show: jest.fn(),
  }),
}));

// Mock expo-tracking-transparency
jest.mock("expo-tracking-transparency", () => ({
  requestTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "denied" }),
  ),
}));
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm check-all` → green.

```bash
git add package.json pnpm-lock.yaml app.config.ts env.ts src/features/ads/ad-unit-ids.ts jest-setup.ts
git commit -m "feat(ads): install google-mobile-ads and tracking-transparency with env plumbing"
```

---

### Task 9: Ad frequency logic (pure) + store

**Files:**
- Create: `src/features/ads/ad-frequency.ts`
- Create: `src/features/ads/use-ad-frequency-store.ts`
- Test: `src/__tests__/ad-frequency.test.ts`

**Interfaces:**
- Produces (consumed by Task 10):

```ts
// ad-frequency.ts
export const AD_ACTION_THRESHOLD = 5;
export const AD_MIN_INTERVAL_MS = 3 * 60_000;
export function shouldShowAd(input: {
  actionCount: number;
  lastShownAt: number | null;
  now: number;
}): boolean;

// use-ad-frequency-store.ts (zustand, session-only, not persisted)
type AdFrequencyState = {
  actionCount: number;
  lastShownAt: number | null;
  forceRequested: boolean;   // dev trigger from settings
  registerAction: () => void;
  requestForceShow: () => void;
  markShown: (now: number) => void; // resets counter + force flag
};
export const useAdFrequencyStore: UseBoundStore<StoreApi<AdFrequencyState>>;
```

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/ad-frequency.test.ts`:

```ts
import {
  AD_ACTION_THRESHOLD,
  AD_MIN_INTERVAL_MS,
  shouldShowAd,
} from "@/features/ads/ad-frequency";
import { useAdFrequencyStore } from "@/features/ads/use-ad-frequency-store";

describe("shouldShowAd", () => {
  it("is false below the action threshold", () => {
    expect(
      shouldShowAd({ actionCount: AD_ACTION_THRESHOLD - 1, lastShownAt: null, now: 1000 }),
    ).toBe(false);
  });

  it("is true at the threshold when never shown before", () => {
    expect(
      shouldShowAd({ actionCount: AD_ACTION_THRESHOLD, lastShownAt: null, now: 1000 }),
    ).toBe(true);
  });

  it("is false when the minimum interval has not elapsed", () => {
    expect(
      shouldShowAd({
        actionCount: AD_ACTION_THRESHOLD,
        lastShownAt: 1000,
        now: 1000 + AD_MIN_INTERVAL_MS - 1,
      }),
    ).toBe(false);
  });

  it("is true when the minimum interval has elapsed", () => {
    expect(
      shouldShowAd({
        actionCount: AD_ACTION_THRESHOLD,
        lastShownAt: 1000,
        now: 1000 + AD_MIN_INTERVAL_MS,
      }),
    ).toBe(true);
  });
});

describe("useAdFrequencyStore", () => {
  beforeEach(() => {
    useAdFrequencyStore.setState({
      actionCount: 0,
      lastShownAt: null,
      forceRequested: false,
    });
  });

  it("registerAction increments the counter", () => {
    useAdFrequencyStore.getState().registerAction();
    useAdFrequencyStore.getState().registerAction();
    expect(useAdFrequencyStore.getState().actionCount).toBe(2);
  });

  it("markShown resets counter, records time, clears force flag", () => {
    useAdFrequencyStore.getState().registerAction();
    useAdFrequencyStore.getState().requestForceShow();
    useAdFrequencyStore.getState().markShown(42_000);
    const state = useAdFrequencyStore.getState();
    expect(state.actionCount).toBe(0);
    expect(state.lastShownAt).toBe(42_000);
    expect(state.forceRequested).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test ad-frequency`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/features/ads/ad-frequency.ts`:

```ts
export const AD_ACTION_THRESHOLD = 5;
export const AD_MIN_INTERVAL_MS = 3 * 60_000;

export function shouldShowAd(input: {
  actionCount: number;
  lastShownAt: number | null;
  now: number;
}): boolean {
  if (input.actionCount < AD_ACTION_THRESHOLD) {
    return false;
  }
  if (input.lastShownAt !== null && input.now - input.lastShownAt < AD_MIN_INTERVAL_MS) {
    return false;
  }
  return true;
}
```

`src/features/ads/use-ad-frequency-store.ts`:

```ts
import { create } from "zustand";

type AdFrequencyState = {
  actionCount: number;
  lastShownAt: number | null;
  forceRequested: boolean;
  registerAction: () => void;
  requestForceShow: () => void;
  markShown: (now: number) => void;
};

// Session-only on purpose: the counter resets on each app launch, which
// also guarantees no ad right at startup (AdMob policy).
export const useAdFrequencyStore = create<AdFrequencyState>(set => ({
  actionCount: 0,
  lastShownAt: null,
  forceRequested: false,
  registerAction: () => set(state => ({ actionCount: state.actionCount + 1 })),
  requestForceShow: () => set({ forceRequested: true }),
  markShown: now => set({ actionCount: 0, lastShownAt: now, forceRequested: false }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test ad-frequency`
Expected: PASS (6 tests).

- [ ] **Step 5: check-all and commit**

```bash
git add src/features/ads src/__tests__/ad-frequency.test.ts
git commit -m "feat(ads): add interstitial frequency rules and session store"
```

---

### Task 10: Interstitial integration — init, gate, triggers, mock removal

**Files:**
- Create: `src/features/ads/ads-init.ts`
- Create: `src/features/ads/use-interstitial-gate.ts`
- Modify: `src/app/(app)/_layout.tsx` (mount init + gate)
- Modify: `src/features/converter/hooks/use-numpad-handlers.ts` (register action in `onTapDone`, ~line 52)
- Modify: `src/app/(app)/my-rate.tsx` (register action next to `incrementRateAttempt()`, ~line 121)
- Modify: `src/app/(app)/price-scanner.tsx` (register action next to `incrementScanAttempt()`, ~line 592)
- Modify: `src/app/(app)/settings.tsx` (dev trigger → force show; drop `FullscreenAd` usage and `isAdVisible` state)
- Delete: `src/components/ui/fullscreen-ad.tsx`; remove its export from `src/components/ui/index.tsx`
- Modify: `src/translations/{en,ru,ar}.json` (drop `adInterstitialBrand`, `adInterstitialTitle`, `adInterstitialText`, `adInterstitialCta`)

**Interfaces:**
- Consumes: `getInterstitialAdUnitId` (Task 8), `shouldShowAd` + `useAdFrequencyStore` (Task 9), `useQuotaStore.isPro`.
- Produces: `initializeAds(): Promise<void>`, `useInterstitialGate(): void`.

- [ ] **Step 1: Consent + SDK init**

Create `src/features/ads/ads-init.ts`:

```ts
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import mobileAds, { AdsConsent } from "react-native-google-mobile-ads";

let started = false;

// UMP consent (EEA/UK requirement) → ATT prompt (iOS) → SDK init.
// Any failure just means ads will not load this session.
export async function initializeAds(): Promise<void> {
  if (started) {
    return;
  }
  started = true;
  try {
    await AdsConsent.gatherConsent();
    await requestTrackingPermissionsAsync();
    await mobileAds().initialize();
  }
  catch {
    // Non-fatal: the app works without ads.
  }
}
```

Note: verify the exact consent API name in the installed version (`AdsConsent.gatherConsent()` in v12+; older versions use `requestInfoUpdate` + `loadAndShowConsentFormIfRequired`). Adjust to the installed version's typings.

- [ ] **Step 2: Gate hook**

Create `src/features/ads/use-interstitial-gate.ts`:

```ts
import * as React from "react";
import { useInterstitialAd } from "react-native-google-mobile-ads";
import { shouldShowAd } from "@/features/ads/ad-frequency";
import { getInterstitialAdUnitId } from "@/features/ads/ad-unit-ids";
import { useAdFrequencyStore } from "@/features/ads/use-ad-frequency-store";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";

export function useInterstitialGate(): void {
  const isPro = useQuotaStore(state => state.isPro);
  const actionCount = useAdFrequencyStore(state => state.actionCount);
  const lastShownAt = useAdFrequencyStore(state => state.lastShownAt);
  const forceRequested = useAdFrequencyStore(state => state.forceRequested);
  const markShown = useAdFrequencyStore(state => state.markShown);

  const { isClosed, isLoaded, load, show } = useInterstitialAd(
    getInterstitialAdUnitId(),
  );

  // Preload for free users; reload after each shown ad.
  React.useEffect(() => {
    if (!isPro) {
      load();
    }
  }, [isPro, isClosed, load]);

  React.useEffect(() => {
    if (isPro || !isLoaded) {
      return;
    }
    const now = Date.now();
    if (forceRequested || shouldShowAd({ actionCount, lastShownAt, now })) {
      show();
      markShown(now);
    }
  }, [actionCount, forceRequested, isLoaded, isPro, lastShownAt, markShown, show]);
}
```

- [ ] **Step 3: Mount in the app layout**

In `src/app/(app)/_layout.tsx`:

```ts
import { initializeAds } from "@/features/ads/ads-init";
import { useInterstitialGate } from "@/features/ads/use-interstitial-gate";
```

Inside `AppLayout()` after `useProStatusSync();`:

```ts
  useInterstitialGate();

  React.useEffect(() => {
    void initializeAds();
  }, []);
```

- [ ] **Step 4: Register significant actions**

In `src/features/converter/hooks/use-numpad-handlers.ts` — import the store and register inside `onTapDone`:

```ts
import { useAdFrequencyStore } from "@/features/ads/use-ad-frequency-store";
```

At the top of the hook body:

```ts
  const registerAdAction = useAdFrequencyStore(state => state.registerAction);
```

First line inside the existing `onTapDone` function:

```ts
    registerAdAction();
```

Same pattern in `src/app/(app)/my-rate.tsx`: add the import and selector, then call `registerAdAction();` on the line right after `incrementRateAttempt();`.

Same in `src/app/(app)/price-scanner.tsx`: call `registerAdAction();` right after `incrementScanAttempt();`. Note this call sits inside a `useEffect`/callback with a dependency array — add `registerAdAction` to that dependency list (zustand action references are stable).

- [ ] **Step 5: Replace the dev trigger; delete the mock**

In `src/app/(app)/settings.tsx`:
- keep the dev button, but change its handler:

```ts
        onTriggerFullscreenAd={() => useAdFrequencyStore.getState().requestForceShow()}
```

with import `import { useAdFrequencyStore } from "@/features/ads/use-ad-frequency-store";`
- remove `<FullscreenAd …/>` from the JSX, the `FullscreenAd` import, and the `isAdVisible`/`setIsAdVisible` state from `useSettingsScreenState` (find it in the same file or the settings state hook — follow the `setIsAdVisible` reference at line ~430).

Delete the mock:

```bash
git rm src/components/ui/fullscreen-ad.tsx
```

Remove the line `export * from "./fullscreen-ad";` from `src/components/ui/index.tsx`.

Remove `adInterstitialBrand`, `adInterstitialCta`, `adInterstitialText`, `adInterstitialTitle` from the `converter` section of all three translation files.

- [ ] **Step 6: Verify and commit**

Run: `pnpm check-all`
Expected: green (global mocks from Task 8 cover the ads SDK in Jest).

```bash
git add -A
git commit -m "feat(ads): real AdMob interstitial with frequency gate, consent flow, and dev trigger"
```

---

### Task 11: Final verification and readiness doc update

**Files:**
- Modify: `DEPLOY_READINESS.md` (item 1 and 2 statuses)

- [ ] **Step 1: Full quality gate**

Run: `pnpm check-all`
Expected: all green, no skipped suites.

- [ ] **Step 2: New dev build + on-device smoke test**

Run: `pnpm prebuild && pnpm ios` (and/or `pnpm android`).

Checklist (works even before store products exist):
- App launches; UMP/ATT prompts appear once on first launch (iOS).
- Home: no banner between the currency list and the numpad; drawer has no yellow "Remove ads" button.
- Paywall: 2 plan cards max (loading state until store products are configured), no Lifetime, no trial text; CTA disabled while loading.
- Settings → dev panel → fullscreen-ad trigger shows a **Google test interstitial**.
- 5 numpad "Done" taps → test interstitial appears; a second one does not appear within 3 minutes.
- With `isPro` toggled on (via a sandbox purchase later, or temporarily via the dev store): no interstitials load.

Sandbox purchase/restore verification is deferred until `pro_monthly`/`pro_yearly` exist in App Store Connect / Play Console (owner prerequisite).

- [ ] **Step 3: Update `DEPLOY_READINESS.md`**

Rewrite blocker item 1 to reflect: expo-iap integrated (client-side validation), AdMob interstitial integrated; remaining owner tasks — store products, Paid Apps agreement, AdMob app/unit IDs, sandbox testing. Mark item 2 (`check-all`) as fixed.

- [ ] **Step 4: Commit**

```bash
git add DEPLOY_READINESS.md
git commit -m "docs: update deploy readiness after monetization integration"
```
