# Price Scanner Manual Capture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the price scanner's continuous auto-scan timer with a manual shutter-button capture: the user aims the camera and explicitly triggers a single frame → single OCR pass → result.

**Architecture:** Extend the existing `useReducer`-based state machine in `use-price-scanner-engine.ts` with new phases (`capturing`, `error`) and one `capture()` action that replaces the `setInterval` loop and `startScan`/`stopScan` actions. The screen (`price-scanner.tsx`) drops its auto-start effect and gains a `ShutterButton` + `ScanErrorBanner`, grouped with the existing bottom controls into a new `ScannerOverlays` component to keep `PriceScannerScreen` under the function-length limit.

**Tech Stack:** Expo Router, React Native, TypeScript, `react-native-mlkit-ocr`, `expo-camera`, Jest + `@testing-library/react-native`, i18next.

**Spec:** `docs/superpowers/specs/2026-07-03-price-scanner-manual-capture-design.md`

## Global Constraints

- ESLint `max-lines-per-function`: 110 lines max per function/component (`currency-converter-app/eslint.config.mjs`).
- Double quotes for all string literals.
- Named imports in alphabetical order.
- No hardcoded UI strings — all copy goes through `i18next` keys in `src/translations/{en,ru,ar}.json`, and all three files must have identical key sets (checked by `pnpm run lint:translations`).
- Never use array index as a list `key` prop (not touched by this plan, but applies to any new lists).
- Run `pnpm run check-all` (lint + type-check + translation lint + tests) before considering the work done.
- Absolute imports only, via the `@/` prefix — never relative imports.

---

### Task 1: Add new translation keys and fix stale permission copy

**Files:**
- Modify: `src/translations/en.json:25-26`, `:88-89`, `:113-114`
- Modify: `src/translations/ru.json:25-26`, `:88-89`, `:113-114`
- Modify: `src/translations/ar.json:25-26`, `:88-89`, `:113-114`

**Interfaces:**
- Produces: translation keys `converter.captureFailed`, `converter.priceNotFound`, `converter.shutterButtonLabel`, consumed by Task 3's `ShutterButton` and `ScanErrorBanner` components via `useTranslation()`.

The camera permission text currently says scanning happens "in real-time" (`cameraPermissionText`). That's no longer true once auto-scan is removed, so it's corrected here alongside the new keys.

- [ ] **Step 1: Update `cameraPermissionText` in all three files**

In `src/translations/en.json`, line 25:
```json
    "cameraPermissionText": "Currency Converter needs access to your camera to scan prices in real-time. We never store photos.",
```
becomes:
```json
    "cameraPermissionText": "Currency Converter needs access to your camera to scan prices. We never store photos.",
```

In `src/translations/ru.json`, line 25:
```json
    "cameraPermissionText": "Конвертеру валют нужен доступ к вашей камере для сканирования цен в реальном времени. Мы никогда не храним ваши фотографии.",
```
becomes:
```json
    "cameraPermissionText": "Конвертеру валют нужен доступ к вашей камере для сканирования цен. Мы никогда не храним ваши фотографии.",
```

In `src/translations/ar.json`, line 25:
```json
    "cameraPermissionText": "يحتاج محول العملات إلى الوصول إلى الكاميرا لمسح الأسعار في الوقت الفعلي. نحن لا نخزن الصور أبداً.",
```
becomes:
```json
    "cameraPermissionText": "يحتاج محول العملات إلى الوصول إلى الكاميرا لمسح الأسعار. نحن لا نخزن الصور أبداً.",
```

- [ ] **Step 2: Insert `captureFailed` (alphabetically between `cameraPermissionTitle` and `changeRate`)**

In `src/translations/en.json`, after line 26 (`"cameraPermissionTitle": "Allow camera access?",`) insert:
```json
    "captureFailed": "Couldn't capture. Please try again.",
```

In `src/translations/ru.json`, same position insert:
```json
    "captureFailed": "Не удалось сделать снимок. Попробуйте ещё раз.",
```

In `src/translations/ar.json`, same position insert:
```json
    "captureFailed": "تعذر التقاط الصورة. حاول مرة أخرى.",
```

- [ ] **Step 3: Insert `priceNotFound` (alphabetically between `planYearly` and `priceOnce`)**

In `src/translations/en.json`, after line 88 (`"planYearly": "Yearly",`) insert:
```json
    "priceNotFound": "Price not detected. Aim the camera more precisely and tap the shutter again.",
```

In `src/translations/ru.json`, same position insert:
```json
    "priceNotFound": "Цена не распознана. Наведите камеру точнее и нажмите кнопку снимка ещё раз.",
```

In `src/translations/ar.json`, same position insert:
```json
    "priceNotFound": "لم يتم التعرف على السعر. صوّب الكاميرا بدقة أكبر واضغط على زر الالتقاط مرة أخرى.",
```

- [ ] **Step 4: Insert `shutterButtonLabel` (alphabetically between `setRateHint` and `submit`)**

In `src/translations/en.json`, after line 113 (`"setRateHint": "Enter how many {{to}} equal 1 {{from}}.",`) insert:
```json
    "shutterButtonLabel": "Capture price",
```

In `src/translations/ru.json`, same position insert:
```json
    "shutterButtonLabel": "Сделать снимок цены",
```

In `src/translations/ar.json`, same position insert:
```json
    "shutterButtonLabel": "التقاط صورة السعر",
```

- [ ] **Step 5: Verify translation key sets still match across all three files**

Run: `pnpm run lint:translations`
Expected: no errors (this rule fails if key sets diverge between `en.json`/`ru.json`/`ar.json`).

- [ ] **Step 6: Commit**

```bash
git add src/translations/en.json src/translations/ru.json src/translations/ar.json
git commit -m "i18n: add manual-capture scanner strings, fix stale real-time copy"
```

---

### Task 2: Rewrite `use-price-scanner-engine.ts` for manual capture (TDD)

**Files:**
- Modify: `src/features/converter/hooks/use-price-scanner-engine.ts` (full rewrite)
- Modify: `src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts` (full rewrite)

**Interfaces:**
- Consumes: `parsePriceFromOcrText(text: string): number | null` from `@/features/converter/utils/price-ocr-parser` (unchanged, not touched by this plan).
- Produces (for Task 3): `usePriceScannerEngine({ initialFrom, initialTo, captureFrame }): { phase: ScanPhase; detectedPrice: number | null; errorReason: ScanErrorReason | null; zoom: number; flashlight: boolean; from: string; to: string; capture: () => Promise<void>; dismiss: () => void; setZoom: (val: number) => void; toggleFlashlight: () => void; setFrom: (code: string) => void; setTo: (code: string) => void; swapCurrencies: () => void; }`. Note `scanIntervalMs` option and `startScan`/`stopScan` are **removed** — Task 3 must not reference them.
- Produces: exported types `ScanPhase = "idle" | "capturing" | "found" | "error"` and `ScanErrorReason = "not_found" | "capture_failed"`.

- [ ] **Step 1: Replace the test file with the new spec (tests will fail — that's expected until Step 4)**

Replace the full contents of `src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts` with:

```ts
import { act, renderHook, waitFor } from "@testing-library/react-native";
import MlkitOcr from "react-native-mlkit-ocr";
import { usePriceScannerEngine } from "../use-price-scanner-engine";

jest.mock("react-native-mlkit-ocr", () => ({
  __esModule: true,
  default: { detectFromUri: jest.fn() },
}));

const noop = () => Promise.resolve(null);

function renderEngine(captureFrame = noop) {
  return renderHook(() =>
    usePriceScannerEngine({
      initialFrom: "USD",
      initialTo: "EUR",
      captureFrame,
    }),
  );
}

describe("usePriceScannerEngine — initial state", () => {
  it("starts in idle phase with null detectedPrice and no error", () => {
    const { result } = renderEngine();
    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
    expect(result.current.errorReason).toBeNull();
    expect(result.current.from).toBe("USD");
    expect(result.current.to).toBe("EUR");
  });
});

describe("usePriceScannerEngine — controls", () => {
  it("clamps zoom to 0–1", () => {
    const { result } = renderEngine();
    act(() => {
      result.current.setZoom(0.5);
    });
    expect(result.current.zoom).toBe(0.5);
    act(() => {
      result.current.setZoom(2);
    });
    expect(result.current.zoom).toBe(1);
    act(() => {
      result.current.setZoom(-1);
    });
    expect(result.current.zoom).toBe(0);
  });

  it("toggles flashlight", () => {
    const { result } = renderEngine();
    expect(result.current.flashlight).toBe(false);
    act(() => {
      result.current.toggleFlashlight();
    });
    expect(result.current.flashlight).toBe(true);
    act(() => {
      result.current.toggleFlashlight();
    });
    expect(result.current.flashlight).toBe(false);
  });

  it("swaps from and to", () => {
    const { result } = renderEngine();
    act(() => {
      result.current.swapCurrencies();
    });
    expect(result.current.from).toBe("EUR");
    expect(result.current.to).toBe("USD");
  });

  it("sets from and to independently", () => {
    const { result } = renderEngine();
    act(() => {
      result.current.setFrom("GBP");
    });
    expect(result.current.from).toBe("GBP");
    act(() => {
      result.current.setTo("JPY");
    });
    expect(result.current.to).toBe("JPY");
  });
});

describe("usePriceScannerEngine — capture() success and failure paths", () => {
  beforeEach(() => {
    (MlkitOcr.detectFromUri as jest.Mock).mockClear();
  });

  it("detects a price and transitions idle -> capturing -> found", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([{ text: "Espresso $4.50" }]);
    const { result } = renderEngine(captureFrame);

    act(() => {
      void result.current.capture();
    });
    expect(result.current.phase).toBe("capturing");

    await waitFor(() => {
      expect(result.current.phase).toBe("found");
    });
    expect(result.current.detectedPrice).toBe(4.5);
    expect(result.current.errorReason).toBeNull();
  });

  it("goes to error(not_found) when OCR text has no price", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([{ text: "Welcome to Coffee Shop" }]);
    const { result } = renderEngine(captureFrame);

    act(() => {
      void result.current.capture();
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("error");
    });
    expect(result.current.errorReason).toBe("not_found");
  });

  it("goes to error(capture_failed) when captureFrame returns null", async () => {
    const captureFrame = jest.fn().mockResolvedValue(null);
    const { result } = renderEngine(captureFrame);

    act(() => {
      void result.current.capture();
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("error");
    });
    expect(result.current.errorReason).toBe("capture_failed");
    expect(MlkitOcr.detectFromUri).not.toHaveBeenCalled();
  });

  it("goes to error(capture_failed) when OCR throws, without crashing", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockRejectedValue(new Error("OCR failed"));
    const { result } = renderEngine(captureFrame);

    act(() => {
      void result.current.capture();
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("error");
    });
    expect(result.current.errorReason).toBe("capture_failed");
  });
});

describe("usePriceScannerEngine — concurrency guard", () => {
  it("ignores a second capture() call while the first is still in-flight", async () => {
    let resolveCapture: (uri: string | null) => void = () => {};
    const captureFrame = jest.fn(() => new Promise<string | null>((resolve) => {
      resolveCapture = resolve;
    }));
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([]);
    const { result } = renderEngine(captureFrame);

    act(() => {
      void result.current.capture();
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("capturing");
    });

    act(() => {
      void result.current.capture();
    });

    expect(captureFrame).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCapture("file:///mock/photo.jpg");
      await Promise.resolve();
    });
  });
});

describe("usePriceScannerEngine — error auto-reset", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("auto-returns to idle ~2s after entering the error phase", async () => {
    const captureFrame = jest.fn().mockResolvedValue(null);
    const { result } = renderEngine(captureFrame);

    act(() => {
      void result.current.capture();
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("error");
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("idle");
    });
    expect(result.current.errorReason).toBeNull();
  });

  it("allows an immediate re-capture from the error phase before the auto-reset fires", async () => {
    const captureFrame = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([{ text: "$9.99" }]);
    const { result } = renderEngine(captureFrame);

    act(() => {
      void result.current.capture();
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("error");
    });

    act(() => {
      void result.current.capture();
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("found");
    });
    expect(result.current.detectedPrice).toBe(9.99);
  });
});

describe("usePriceScannerEngine — dismiss", () => {
  it("dismiss resets phase to idle and clears detectedPrice", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([{ text: "$4.50" }]);
    const { result } = renderEngine(captureFrame);

    act(() => {
      void result.current.capture();
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("found");
    });

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm test use-price-scanner-engine.test.ts`
Expected: FAIL — `result.current.capture is not a function` (or similar), since the hook still only exports `startScan`/`stopScan` and has no `errorReason`/`capture`.

- [ ] **Step 3: Replace `use-price-scanner-engine.ts` with the new implementation**

Replace the full contents of `src/features/converter/hooks/use-price-scanner-engine.ts` with:

```ts
import * as React from "react";
import MlkitOcr from "react-native-mlkit-ocr";
import { parsePriceFromOcrText } from "@/features/converter/utils/price-ocr-parser";

export type ScanPhase = "idle" | "capturing" | "found" | "error";
export type ScanErrorReason = "not_found" | "capture_failed";

type ScannerState = {
  phase: ScanPhase;
  detectedPrice: number | null;
  errorReason: ScanErrorReason | null;
  zoom: number;
  flashlight: boolean;
  from: string;
  to: string;
};

type ScannerAction
  = | { type: "CAPTURE_START" }
    | { type: "CAPTURE_SUCCESS"; price: number }
    | { type: "CAPTURE_NOT_FOUND" }
    | { type: "CAPTURE_ERROR" }
    | { type: "RESET_TO_IDLE" }
    | { type: "DISMISS" }
    | { type: "SET_ZOOM"; zoom: number }
    | { type: "TOGGLE_FLASHLIGHT" }
    | { type: "SET_FROM"; code: string }
    | { type: "SET_TO"; code: string }
    | { type: "SWAP_CURRENCIES" };

function scannerReducer(state: ScannerState, action: ScannerAction): ScannerState {
  switch (action.type) {
    case "CAPTURE_START":
      return state.phase === "idle" || state.phase === "error"
        ? { ...state, phase: "capturing", errorReason: null }
        : state;
    case "CAPTURE_SUCCESS":
      return state.phase === "capturing"
        ? { ...state, phase: "found", detectedPrice: action.price }
        : state;
    case "CAPTURE_NOT_FOUND":
      return state.phase === "capturing"
        ? { ...state, phase: "error", errorReason: "not_found" }
        : state;
    case "CAPTURE_ERROR":
      return state.phase === "capturing"
        ? { ...state, phase: "error", errorReason: "capture_failed" }
        : state;
    case "RESET_TO_IDLE":
      return state.phase === "error"
        ? { ...state, phase: "idle", errorReason: null }
        : state;
    case "DISMISS":
      return { ...state, phase: "idle", detectedPrice: null };
    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0, Math.min(1, action.zoom)) };
    case "TOGGLE_FLASHLIGHT":
      return { ...state, flashlight: !state.flashlight };
    case "SET_FROM":
      return { ...state, from: action.code };
    case "SET_TO":
      return { ...state, to: action.code };
    case "SWAP_CURRENCIES":
      return { ...state, from: state.to, to: state.from };
    default:
      return state;
  }
}

export type PriceScannerEngineOptions = {
  initialFrom: string;
  initialTo: string;
  captureFrame: () => Promise<string | null>;
};

export function usePriceScannerEngine({
  initialFrom,
  initialTo,
  captureFrame,
}: PriceScannerEngineOptions) {
  const [state, dispatch] = React.useReducer(scannerReducer, {
    phase: "idle",
    detectedPrice: null,
    errorReason: null,
    zoom: 0,
    flashlight: false,
    from: initialFrom,
    to: initialTo,
  });

  const captureFrameRef = React.useRef(captureFrame);
  captureFrameRef.current = captureFrame;

  const phaseRef = React.useRef(state.phase);
  phaseRef.current = state.phase;

  const capture = React.useCallback(async () => {
    if (phaseRef.current === "capturing")
      return;

    dispatch({ type: "CAPTURE_START" });
    try {
      const uri = await captureFrameRef.current();
      if (!uri) {
        dispatch({ type: "CAPTURE_ERROR" });
        return;
      }
      const blocks = await MlkitOcr.detectFromUri(uri);
      const text = (blocks as Array<{ text: string }>).map(b => b.text).join(" ");
      const price = parsePriceFromOcrText(text);
      if (price !== null) {
        dispatch({ type: "CAPTURE_SUCCESS", price });
      }
      else {
        dispatch({ type: "CAPTURE_NOT_FOUND" });
      }
    }
    catch {
      dispatch({ type: "CAPTURE_ERROR" });
    }
  }, []);

  React.useEffect(() => {
    if (state.phase !== "error")
      return;

    const timerId = setTimeout(() => dispatch({ type: "RESET_TO_IDLE" }), 2000);
    return () => clearTimeout(timerId);
  }, [state.phase]);

  return {
    phase: state.phase,
    detectedPrice: state.detectedPrice,
    errorReason: state.errorReason,
    zoom: state.zoom,
    flashlight: state.flashlight,
    from: state.from,
    to: state.to,
    capture,
    dismiss: React.useCallback(() => dispatch({ type: "DISMISS" }), []),
    setZoom: React.useCallback((zoom: number) => dispatch({ type: "SET_ZOOM", zoom }), []),
    toggleFlashlight: React.useCallback(() => dispatch({ type: "TOGGLE_FLASHLIGHT" }), []),
    setFrom: React.useCallback((code: string) => dispatch({ type: "SET_FROM", code }), []),
    setTo: React.useCallback((code: string) => dispatch({ type: "SET_TO", code }), []),
    swapCurrencies: React.useCallback(() => dispatch({ type: "SWAP_CURRENCIES" }), []),
  };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm test use-price-scanner-engine.test.ts`
Expected: PASS — all suites (`initial state`, `controls`, `capture() success and failure paths`, `concurrency guard`, `error auto-reset`, `dismiss`) green.

- [ ] **Step 5: Type-check and lint just this file pair**

Run: `pnpm run type-check`
Expected: no errors.

Run: `pnpm exec eslint src/features/converter/hooks/use-price-scanner-engine.ts src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts`
Expected: no errors (check in particular that `usePriceScannerEngine`'s body is under 110 lines — it should be, at roughly 75).

- [ ] **Step 6: Commit**

```bash
git add src/features/converter/hooks/use-price-scanner-engine.ts src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts
git commit -m "feat: replace auto-scan interval with manual capture in price scanner engine"
```

---

### Task 3: Wire manual capture into the scanner screen

**Files:**
- Modify: `src/app/(app)/price-scanner.tsx`

**Interfaces:**
- Consumes: `usePriceScannerEngine` return shape from Task 2 (`phase`, `errorReason`, `capture`, etc.) and the translation keys from Task 1 (`converter.captureFailed`, `converter.priceNotFound`, `converter.shutterButtonLabel`).
- Produces: no new exports consumed elsewhere — this is the leaf screen component.

There is no existing render-test suite for this screen (only the engine hook is unit-tested in this feature, per current project convention) — verification for this task is type-check, lint, and a manual on-device check.

- [ ] **Step 1: Update the import of `usePriceScannerEngine` to also bring in `ScanErrorReason`**

In `src/app/(app)/price-scanner.tsx`, change:
```ts
import { usePriceScannerEngine } from "@/features/converter/hooks/use-price-scanner-engine";
```
to:
```ts
import { type ScanErrorReason, usePriceScannerEngine } from "@/features/converter/hooks/use-price-scanner-engine";
```

- [ ] **Step 2: Add `ShutterButton` and `ScanErrorBanner` components, and the `ScannerOverlays` wrapper**

Find this exact anchor (the end of `LimitBanner` followed by the start of `ViewfinderOverlay`):
```tsx
        <Text className="text-[10px] font-black text-accent-ink uppercase">
          {t("converter.pro")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function ViewfinderOverlay() {
```
and insert the following three new exported functions between the `LimitBanner` closing `}` and `export function ViewfinderOverlay() {` (i.e. replace the anchor above with itself plus the new code inserted in the blank line in the middle):

```tsx
export function ShutterButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="absolute inset-x-0 bottom-36 z-10 items-center">
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t("converter.shutterButtonLabel")}
        className={`size-[72px] items-center justify-center rounded-full border-4 border-white/80 ${
          disabled ? "bg-white/40" : "bg-white"
        }`}
      >
        {disabled && <ActivityIndicator size="small" color="#0E0E10" />}
      </TouchableOpacity>
    </View>
  );
}

export function ScanErrorBanner({ reason }: { reason: ScanErrorReason }) {
  const { t } = useTranslation();

  return (
    <View className="absolute inset-x-4 bottom-60 z-10 rounded-2xl border border-white/10 bg-neutral-900/90 p-3.5">
      <Text className="text-center text-xs font-semibold text-white/90">
        {t(reason === "not_found" ? "converter.priceNotFound" : "converter.captureFailed")}
      </Text>
    </View>
  );
}

export function ScannerOverlays({
  phase,
  errorReason,
  zoom,
  onZoomChange,
  flashlight,
  onFlashlightToggle,
  onCapture,
  isPro,
  ocrScanAttempts,
  onOpenPaywall,
}: {
  phase: ScanPhase;
  errorReason: ScanErrorReason | null;
  zoom: number;
  onZoomChange: (val: number) => void;
  flashlight: boolean;
  onFlashlightToggle: () => void;
  onCapture: () => void;
  isPro: boolean;
  ocrScanAttempts: number;
  onOpenPaywall: () => void;
}) {
  return (
    <>
      <ViewfinderControls
        zoom={zoom}
        onZoomChange={onZoomChange}
        flashlight={flashlight}
        onFlashlightToggle={onFlashlightToggle}
      />

      <ShutterButton
        disabled={phase === "capturing"}
        onPress={onCapture}
      />

      {phase === "error" && errorReason !== null && (
        <ScanErrorBanner reason={errorReason} />
      )}

      {!isPro && (
        <LimitBanner
          count={ocrScanAttempts}
          limit={3}
          onOpenPaywall={onOpenPaywall}
        />
      )}
    </>
  );
}
```

The original `export function ViewfinderOverlay() {` line (shown at the end of the anchor above) stays exactly where it was, immediately following the new code — you are inserting these three functions before it, not replacing it.

Note `ScannerOverlays` takes a `phase: ScanPhase` prop — add `import type { ScanPhase } from "@/features/converter/hooks/use-price-scanner-engine";` to the same import (merge with the `ScanErrorReason` type import from Step 1):
```ts
import { type ScanErrorReason, type ScanPhase, usePriceScannerEngine } from "@/features/converter/hooks/use-price-scanner-engine";
```

- [ ] **Step 3: Remove the auto-start effect and `startScan` destructure in `usePriceScannerState`**

Change:
```ts
  // Destructure stable callbacks so effects have correct deps without eslint-disable.
  const { startScan, dismiss: engineDismiss } = engine;
  const enginePhase = engine.phase;

  // Auto-start scanning when camera permission is granted.
  React.useEffect(() => {
    if (permission?.granted) {
      startScan();
    }
  }, [permission?.granted, startScan]);

  // Quota guard: intercept the transition into "found".
```
to:
```ts
  // Destructure stable callbacks so effects have correct deps without eslint-disable.
  const { dismiss: engineDismiss } = engine;
  const enginePhase = engine.phase;

  // Quota guard: intercept the transition into "found".
```

- [ ] **Step 4: Replace the inline `ViewfinderControls`/`LimitBanner` render block with `ScannerOverlays`**

Change:
```tsx
        <ViewfinderControls
          zoom={state.engine.zoom}
          onZoomChange={state.engine.setZoom}
          flashlight={state.engine.flashlight}
          onFlashlightToggle={state.engine.toggleFlashlight}
        />

        {!state.isPro && (
          <LimitBanner
            count={state.ocrScanAttempts}
            limit={3}
            onOpenPaywall={state.handleOpenPaywall}
          />
        )}
```
to:
```tsx
        <ScannerOverlays
          phase={state.engine.phase}
          errorReason={state.engine.errorReason}
          zoom={state.engine.zoom}
          onZoomChange={state.engine.setZoom}
          flashlight={state.engine.flashlight}
          onFlashlightToggle={state.engine.toggleFlashlight}
          onCapture={state.engine.capture}
          isPro={state.isPro}
          ocrScanAttempts={state.ocrScanAttempts}
          onOpenPaywall={state.handleOpenPaywall}
        />
```

- [ ] **Step 5: Type-check and lint the screen file**

Run: `pnpm run type-check`
Expected: no errors — in particular, no leftover reference to `startScan`, `stopScan`, or `scanIntervalMs` anywhere in the file.

Run: `pnpm exec eslint src/app/\(app\)/price-scanner.tsx`
Expected: no errors, including `max-lines-per-function` staying under 110 for both `usePriceScannerState` and `PriceScannerScreen`. If `PriceScannerScreen` still exceeds 110 lines, move the `<CurrencyPickerModal>` block out into its own small wrapper component the same way `ScannerOverlays` was extracted — do not disable the lint rule.

- [ ] **Step 6: Grep-verify no dead references remain**

Run: `grep -rn "startScan\|stopScan\|scanIntervalMs" src --include="*.ts" --include="*.tsx"`
Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/price-scanner.tsx
git commit -m "feat: add manual shutter capture UI to price scanner screen"
```

---

### Task 4: Full verification pass

**Files:** none modified — verification only.

- [ ] **Step 1: Run the full quality gate**

Run: `pnpm run check-all`
Expected: lint, type-check, translation-key lint, and the full Jest suite all pass with no failures.

- [ ] **Step 2: Manual on-device/simulator check**

Start a development build (`pnpm ios` or `pnpm android`) and walk through:
1. Open the price scanner — camera preview appears live and static (no continuous scanning), shutter button visible at the bottom.
2. Point at a printed price, tap the shutter — spinner appears on the button briefly, then `ScanResultCard` shows the correct converted amount.
3. Dismiss the result — returns to idle with the shutter button active again.
4. Point at text with no price, tap the shutter — error banner appears ("Price not detected...") and the screen returns to a ready-to-shoot state within ~2 seconds.
5. Zoom +/- and flashlight toggle still work exactly as before.
6. Currency swap and the currency picker still work exactly as before.
7. As a free-tier user, trigger 3 successful scans, then a 4th — confirms routing to `/paywall` exactly as before.
8. Rapidly double-tap the shutter — only one capture happens, no crash, no duplicate quota decrement.

- [ ] **Step 3: Commit any fixups found during manual verification**

If Step 2 surfaces issues, fix them, re-run `pnpm run check-all`, then:
```bash
git add -A
git commit -m "fix: address issues found in manual price-scanner verification"
```
(Skip this step entirely if no issues were found.)
