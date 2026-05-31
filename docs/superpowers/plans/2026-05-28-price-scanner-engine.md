# Price Scanner Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock price-scanner timer with a real on-device OCR engine (Google ML Kit), extracted into a `use-price-scanner-engine` hook that follows the same reducer pattern as `use-calculator-engine.ts`.

**Architecture:** A `useReducer`-based state machine hook (`use-price-scanner-engine.ts`) manages scan phase transitions, camera controls, and the currency pair. It accepts a `captureFrame` callback and drives a `setInterval` OCR loop while in the `"scanning"` phase. A pure utility (`price-ocr-parser.ts`) handles regex extraction of prices from raw OCR text. The screen's `usePriceScannerState` becomes a thin orchestrator that wires the engine to Zustand stores, routing, and camera permissions.

**Tech Stack:** React Native, `expo-camera` (frame capture), `react-native-mlkit-ocr` (Google ML Kit on-device OCR), Zustand, React Query, Jest + `@testing-library/react-native`.

---

## File Map

| Action | File |
|--------|------|
| NEW | `src/features/converter/utils/price-ocr-parser.ts` |
| NEW | `src/features/converter/utils/__tests__/price-ocr-parser.test.ts` |
| NEW | `src/features/converter/hooks/use-price-scanner-engine.ts` |
| NEW | `src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts` |
| MODIFIED | `src/app/(app)/price-scanner.tsx` |

---

### Task 1: Add react-native-mlkit-ocr dependency

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install the package**

```bash
pnpm add react-native-mlkit-ocr
```

Expected: package appears in `package.json` dependencies.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add react-native-mlkit-ocr for on-device OCR"
```

> **Note:** Native module — requires a development build. It does **not** work in Expo Go.  
> After all code changes are done: `npx expo prebuild --clean && npx expo run:ios`

---

### Task 2: OCR price parser utility (TDD)

**Files:**
- Create: `src/features/converter/utils/__tests__/price-ocr-parser.test.ts`
- Create: `src/features/converter/utils/price-ocr-parser.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/features/converter/utils/__tests__/price-ocr-parser.test.ts`:

```ts
import { parsePriceFromOcrText } from "../price-ocr-parser";

describe("parsePriceFromOcrText", () => {
  it("extracts price with dollar symbol prefix", () => {
    expect(parsePriceFromOcrText("Croissant $78.42")).toBe(78.42);
  });

  it("extracts price with euro symbol prefix and comma decimal", () => {
    expect(parsePriceFromOcrText("Prix: €12,50")).toBe(12.5);
  });

  it("extracts price with symbol suffix", () => {
    expect(parsePriceFromOcrText("Total 45.00$")).toBe(45.0);
  });

  it("extracts plain decimal number when no symbol present", () => {
    expect(parsePriceFromOcrText("Total 99.99")).toBe(99.99);
  });

  it("prefers symbol-prefixed price over a plain number", () => {
    expect(parsePriceFromOcrText("3 items $5.00 each")).toBe(5.0);
  });

  it("returns null when text contains no price-like pattern", () => {
    expect(parsePriceFromOcrText("Coffee and Cake")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePriceFromOcrText("")).toBeNull();
  });

  it("handles price surrounded by other text", () => {
    expect(parsePriceFromOcrText("Menu Espresso £3.50 per cup")).toBe(3.5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/features/converter/utils/__tests__/price-ocr-parser.test.ts
```

Expected: `Cannot find module '../price-ocr-parser'`

- [ ] **Step 3: Implement the parser**

Create `src/features/converter/utils/price-ocr-parser.ts`:

```ts
const CURRENCY_SYMBOLS = "[$€£¥₹₩₺]";
const NUMBER_PATTERN = "\\d+(?:[.,]\\d{1,4})?";

const PREFIX_REGEX = new RegExp(`${CURRENCY_SYMBOLS}\\s*(${NUMBER_PATTERN})`);
const SUFFIX_REGEX = new RegExp(`(${NUMBER_PATTERN})\\s*${CURRENCY_SYMBOLS}`);
const PLAIN_DECIMAL_REGEX = new RegExp(`\\b(\\d+[.,]\\d{1,4})\\b`);

function parseDecimalString(str: string): number {
  if (str.includes(",") && !str.includes(".")) {
    return parseFloat(str.replace(",", "."));
  }
  return parseFloat(str.replace(/,/g, ""));
}

export function parsePriceFromOcrText(text: string): number | null {
  let match = PREFIX_REGEX.exec(text);
  if (match) return parseDecimalString(match[1]);

  match = SUFFIX_REGEX.exec(text);
  if (match) return parseDecimalString(match[1]);

  match = PLAIN_DECIMAL_REGEX.exec(text);
  if (match) return parseDecimalString(match[1]);

  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test src/features/converter/utils/__tests__/price-ocr-parser.test.ts
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/converter/utils/price-ocr-parser.ts \
        src/features/converter/utils/__tests__/price-ocr-parser.test.ts
git commit -m "feat: add parsePriceFromOcrText pure utility"
```

---

### Task 3: Scanner engine — state machine only (no OCR yet)

**Files:**
- Create: `src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts`
- Create: `src/features/converter/hooks/use-price-scanner-engine.ts`

- [ ] **Step 1: Write the failing state-machine tests**

Create `src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts`:

```ts
jest.mock("react-native-mlkit-ocr", () => ({
  default: { detectFromUri: jest.fn() },
}));

import { act, renderHook } from "@testing-library/react-native";
import { usePriceScannerEngine } from "../use-price-scanner-engine";

const noop = () => Promise.resolve(null);

describe("usePriceScannerEngine — state machine", () => {
  it("starts in idle phase with null detectedPrice", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
    expect(result.current.from).toBe("USD");
    expect(result.current.to).toBe("EUR");
  });

  it("transitions to scanning on startScan", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => { result.current.startScan(); });
    expect(result.current.phase).toBe("scanning");
  });

  it("transitions back to idle on stopScan", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => { result.current.startScan(); });
    act(() => { result.current.stopScan(); });
    expect(result.current.phase).toBe("idle");
  });

  it("dismiss resets phase to idle and clears detectedPrice", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => { result.current.dismiss(); });
    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
  });

  it("clamps zoom to 0–1", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => { result.current.setZoom(0.5); });
    expect(result.current.zoom).toBe(0.5);

    act(() => { result.current.setZoom(2); });
    expect(result.current.zoom).toBe(1);

    act(() => { result.current.setZoom(-1); });
    expect(result.current.zoom).toBe(0);
  });

  it("toggles flashlight", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    expect(result.current.flashlight).toBe(false);
    act(() => { result.current.toggleFlashlight(); });
    expect(result.current.flashlight).toBe(true);
    act(() => { result.current.toggleFlashlight(); });
    expect(result.current.flashlight).toBe(false);
  });

  it("swaps from and to", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => { result.current.swapCurrencies(); });
    expect(result.current.from).toBe("EUR");
    expect(result.current.to).toBe("USD");
  });

  it("sets from and to independently", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => { result.current.setFrom("GBP"); });
    expect(result.current.from).toBe("GBP");
    act(() => { result.current.setTo("JPY"); });
    expect(result.current.to).toBe("JPY");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts
```

Expected: `Cannot find module '../use-price-scanner-engine'`

- [ ] **Step 3: Implement the reducer and hook (OCR useEffect omitted for now)**

Create `src/features/converter/hooks/use-price-scanner-engine.ts`:

```ts
import * as React from "react";

export type ScanPhase = "idle" | "scanning" | "found";

type ScannerState = {
  phase: ScanPhase;
  detectedPrice: number | null;
  zoom: number;
  flashlight: boolean;
  from: string;
  to: string;
};

type ScannerAction =
  | { type: "START_SCAN" }
  | { type: "STOP_SCAN" }
  | { type: "PRICE_FOUND"; price: number }
  | { type: "DISMISS" }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "TOGGLE_FLASHLIGHT" }
  | { type: "SET_FROM"; code: string }
  | { type: "SET_TO"; code: string }
  | { type: "SWAP_CURRENCIES" };

function scannerReducer(state: ScannerState, action: ScannerAction): ScannerState {
  switch (action.type) {
    case "START_SCAN":
      return state.phase === "idle" ? { ...state, phase: "scanning" } : state;
    case "STOP_SCAN":
      return state.phase === "scanning" ? { ...state, phase: "idle" } : state;
    case "PRICE_FOUND":
      return state.phase === "scanning"
        ? { ...state, phase: "found", detectedPrice: action.price }
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
  scanIntervalMs?: number;
};

export function usePriceScannerEngine({
  initialFrom,
  initialTo,
  captureFrame,
  scanIntervalMs = 2500,
}: PriceScannerEngineOptions) {
  const [state, dispatch] = React.useReducer(scannerReducer, {
    phase: "idle",
    detectedPrice: null,
    zoom: 0,
    flashlight: false,
    from: initialFrom,
    to: initialTo,
  });

  const captureFrameRef = React.useRef(captureFrame);
  captureFrameRef.current = captureFrame;

  return {
    phase: state.phase,
    detectedPrice: state.detectedPrice,
    zoom: state.zoom,
    flashlight: state.flashlight,
    from: state.from,
    to: state.to,
    startScan: React.useCallback(() => dispatch({ type: "START_SCAN" }), []),
    stopScan: React.useCallback(() => dispatch({ type: "STOP_SCAN" }), []),
    dismiss: React.useCallback(() => dispatch({ type: "DISMISS" }), []),
    setZoom: React.useCallback((zoom: number) => dispatch({ type: "SET_ZOOM", zoom }), []),
    toggleFlashlight: React.useCallback(() => dispatch({ type: "TOGGLE_FLASHLIGHT" }), []),
    setFrom: React.useCallback((code: string) => dispatch({ type: "SET_FROM", code }), []),
    setTo: React.useCallback((code: string) => dispatch({ type: "SET_TO", code }), []),
    swapCurrencies: React.useCallback(() => dispatch({ type: "SWAP_CURRENCIES" }), []),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts
```

Expected: All 8 state-machine tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/converter/hooks/use-price-scanner-engine.ts \
        src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts
git commit -m "feat: add use-price-scanner-engine state machine"
```

---

### Task 4: OCR pipeline in the engine

**Files:**
- Modify: `src/features/converter/hooks/use-price-scanner-engine.ts`
- Modify: `src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts`

- [ ] **Step 1: Append OCR pipeline tests to the test file**

Open `src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts`.

**Add these two imports at the top of the file** (after the existing imports):

```ts
import MlkitOcr from "react-native-mlkit-ocr";
import { waitFor } from "@testing-library/react-native";
```

**Then append this describe block at the bottom of the file** (after the closing `});` of the first describe block):

```ts
describe("usePriceScannerEngine — OCR pipeline", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (MlkitOcr.detectFromUri as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("detects price and transitions to found after one interval tick", async () => {
    const uri = "file:///mock/photo.jpg";
    const captureFrame = jest.fn().mockResolvedValue(uri);
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([
      { text: "Espresso $4.50" },
    ]);

    const { result } = renderHook(() =>
      usePriceScannerEngine({
        initialFrom: "USD",
        initialTo: "EUR",
        captureFrame,
        scanIntervalMs: 1000,
      }),
    );

    act(() => { result.current.startScan(); });
    expect(result.current.phase).toBe("scanning");

    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(result.current.phase).toBe("found");
      expect(result.current.detectedPrice).toBe(4.5);
    });
  });

  it("keeps scanning when captureFrame returns null", async () => {
    const captureFrame = jest.fn().mockResolvedValue(null);

    const { result } = renderHook(() =>
      usePriceScannerEngine({
        initialFrom: "USD",
        initialTo: "EUR",
        captureFrame,
        scanIntervalMs: 1000,
      }),
    );

    act(() => { result.current.startScan(); });
    act(() => { jest.advanceTimersByTime(2000); });

    await waitFor(() => {
      expect(result.current.phase).toBe("scanning");
      expect(MlkitOcr.detectFromUri).not.toHaveBeenCalled();
    });
  });

  it("keeps scanning when OCR text contains no price", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([
      { text: "Welcome to Coffee Shop" },
    ]);

    const { result } = renderHook(() =>
      usePriceScannerEngine({
        initialFrom: "USD",
        initialTo: "EUR",
        captureFrame,
        scanIntervalMs: 1000,
      }),
    );

    act(() => { result.current.startScan(); });
    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(result.current.phase).toBe("scanning");
    });
  });

  it("does not crash and keeps scanning when OCR throws", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockRejectedValue(new Error("OCR failed"));

    const { result } = renderHook(() =>
      usePriceScannerEngine({
        initialFrom: "USD",
        initialTo: "EUR",
        captureFrame,
        scanIntervalMs: 1000,
      }),
    );

    act(() => { result.current.startScan(); });
    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(result.current.phase).toBe("scanning");
    });
  });

  it("stops calling captureFrame after stopScan", async () => {
    const captureFrame = jest.fn().mockResolvedValue(null);

    const { result } = renderHook(() =>
      usePriceScannerEngine({
        initialFrom: "USD",
        initialTo: "EUR",
        captureFrame,
        scanIntervalMs: 1000,
      }),
    );

    act(() => { result.current.startScan(); });
    act(() => { result.current.stopScan(); });

    const callsBefore = captureFrame.mock.calls.length;
    act(() => { jest.advanceTimersByTime(2000); });

    await waitFor(() => {
      expect(captureFrame.mock.calls.length).toBe(callsBefore);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify the new OCR tests fail**

```bash
pnpm test src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts
```

Expected: The 5 new OCR pipeline tests fail because the `useEffect` with the interval is not yet implemented.

- [ ] **Step 3: Add imports and the OCR pipeline useEffect**

Replace the entire content of `src/features/converter/hooks/use-price-scanner-engine.ts` with:

```ts
import * as React from "react";
import MlkitOcr from "react-native-mlkit-ocr";
import { parsePriceFromOcrText } from "@/features/converter/utils/price-ocr-parser";

export type ScanPhase = "idle" | "scanning" | "found";

type ScannerState = {
  phase: ScanPhase;
  detectedPrice: number | null;
  zoom: number;
  flashlight: boolean;
  from: string;
  to: string;
};

type ScannerAction =
  | { type: "START_SCAN" }
  | { type: "STOP_SCAN" }
  | { type: "PRICE_FOUND"; price: number }
  | { type: "DISMISS" }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "TOGGLE_FLASHLIGHT" }
  | { type: "SET_FROM"; code: string }
  | { type: "SET_TO"; code: string }
  | { type: "SWAP_CURRENCIES" };

function scannerReducer(state: ScannerState, action: ScannerAction): ScannerState {
  switch (action.type) {
    case "START_SCAN":
      return state.phase === "idle" ? { ...state, phase: "scanning" } : state;
    case "STOP_SCAN":
      return state.phase === "scanning" ? { ...state, phase: "idle" } : state;
    case "PRICE_FOUND":
      return state.phase === "scanning"
        ? { ...state, phase: "found", detectedPrice: action.price }
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
  scanIntervalMs?: number;
};

export function usePriceScannerEngine({
  initialFrom,
  initialTo,
  captureFrame,
  scanIntervalMs = 2500,
}: PriceScannerEngineOptions) {
  const [state, dispatch] = React.useReducer(scannerReducer, {
    phase: "idle",
    detectedPrice: null,
    zoom: 0,
    flashlight: false,
    from: initialFrom,
    to: initialTo,
  });

  const captureFrameRef = React.useRef(captureFrame);
  captureFrameRef.current = captureFrame;

  React.useEffect(() => {
    if (state.phase !== "scanning") return;

    const intervalId = setInterval(async () => {
      try {
        const uri = await captureFrameRef.current();
        if (!uri) return;
        const blocks = await MlkitOcr.detectFromUri(uri);
        const text = (blocks as Array<{ text: string }>).map(b => b.text).join(" ");
        const price = parsePriceFromOcrText(text);
        if (price !== null) {
          dispatch({ type: "PRICE_FOUND", price });
        }
      } catch {
        // OCR error — retry on next tick
      }
    }, scanIntervalMs);

    return () => clearInterval(intervalId);
  }, [state.phase, scanIntervalMs]);

  return {
    phase: state.phase,
    detectedPrice: state.detectedPrice,
    zoom: state.zoom,
    flashlight: state.flashlight,
    from: state.from,
    to: state.to,
    startScan: React.useCallback(() => dispatch({ type: "START_SCAN" }), []),
    stopScan: React.useCallback(() => dispatch({ type: "STOP_SCAN" }), []),
    dismiss: React.useCallback(() => dispatch({ type: "DISMISS" }), []),
    setZoom: React.useCallback((zoom: number) => dispatch({ type: "SET_ZOOM", zoom }), []),
    toggleFlashlight: React.useCallback(() => dispatch({ type: "TOGGLE_FLASHLIGHT" }), []),
    setFrom: React.useCallback((code: string) => dispatch({ type: "SET_FROM", code }), []),
    setTo: React.useCallback((code: string) => dispatch({ type: "SET_TO", code }), []),
    swapCurrencies: React.useCallback(() => dispatch({ type: "SWAP_CURRENCIES" }), []),
  };
}
```

- [ ] **Step 4: Run all engine tests to verify they pass**

```bash
pnpm test src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts
```

Expected: All 13 tests pass (8 state-machine + 5 OCR pipeline).

- [ ] **Step 5: Commit**

```bash
git add src/features/converter/hooks/use-price-scanner-engine.ts \
        src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts
git commit -m "feat: add OCR pipeline to use-price-scanner-engine"
```

---

### Task 5: Refactor price-scanner.tsx to use the engine

**Files:**
- Modify: `src/app/(app)/price-scanner.tsx`

- [ ] **Step 1: Add the engine import**

After the existing imports in `src/app/(app)/price-scanner.tsx`, add:

```ts
import { usePriceScannerEngine } from "@/features/converter/hooks/use-price-scanner-engine";
```

Place it in alphabetical order with the other `@/features/converter/hooks/` imports.

- [ ] **Step 2: Replace `ViewfinderOverlay` — remove isMockHighlight and the mock menu card**

Replace the entire `ViewfinderOverlay` component (the function and its prop types) with:

```tsx
export function ViewfinderOverlay() {
  return (
    <View className="absolute inset-0">
      <View className="absolute inset-x-0 top-0 h-[30%] bg-black/45" />
      <View className="absolute inset-x-0 bottom-0 h-[40%] bg-black/45" />
      <View className="absolute top-[30%] bottom-[40%] left-0 w-[12%] bg-black/45" />
      <View className="absolute top-[30%] right-0 bottom-[40%] w-[12%] bg-black/45" />

      <View className="absolute top-[30%] right-[12%] bottom-[40%] left-[12%] items-center justify-center">
        <View className="absolute top-0 left-0 size-6 border-t-2 border-l-2 border-white" />
        <View className="absolute top-0 right-0 size-6 border-t-2 border-r-2 border-white" />
        <View className="absolute bottom-0 left-0 size-6 border-b-2 border-l-2 border-white" />
        <View className="absolute right-0 bottom-0 size-6 border-r-2 border-b-2 border-white" />
        <View className="h-0.5 w-[90%] bg-red/60 shadow-lg shadow-red-500/50" />
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Replace `usePriceScannerState`**

Replace the entire `usePriceScannerState` function (starts at `function usePriceScannerState()`) with:

```ts
function usePriceScannerState() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView>(null);

  const { baseCurrency, targetCurrencies } = useConverterStore();
  const { isPro, ocrScanAttempts, incrementScanAttempt } = useQuotaStore();
  const { data: currenciesData } = useCurrencies();
  const { rates } = useExchangeRates();
  const decimalPlaces = useSettingsStore(state => state.decimalPlaces);

  const [isPickerOpen, setIsPickerOpen] = React.useState<{ side: "from" | "to" } | null>(null);

  const selectableCurrencies = React.useMemo(
    () => [baseCurrency, ...targetCurrencies],
    [baseCurrency, targetCurrencies],
  );

  const captureFrame = React.useCallback(async () => {
    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.5,
      skipProcessing: true,
    });
    return photo?.uri ?? null;
  }, []);

  const engine = usePriceScannerEngine({
    initialFrom: baseCurrency,
    initialTo: targetCurrencies[0] ?? "EUR",
    captureFrame,
  });

  // Auto-start scanning when camera permission is granted.
  // engine.startScan is stable (useCallback with empty deps).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (permission?.granted) engine.startScan();
  }, [permission?.granted]);

  // Quota guard: intercept the transition into "found".
  // engine.dismiss is stable (useCallback with empty deps).
  const prevPhaseRef = React.useRef(engine.phase);
  React.useEffect(() => {
    if (prevPhaseRef.current !== "found" && engine.phase === "found") {
      if (!isPro && ocrScanAttempts >= 3) {
        engine.dismiss();
        router.push("/paywall");
      } else {
        incrementScanAttempt();
      }
    }
    prevPhaseRef.current = engine.phase;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.phase, isPro, ocrScanAttempts, incrementScanAttempt, router]);

  return {
    cameraRef,
    permission,
    requestPermission,
    isPro,
    ocrScanAttempts,
    currenciesData,
    rates,
    decimalPlaces,
    isPickerOpen,
    setIsPickerOpen,
    selectableCurrencies,
    handleBack: router.back,
    handleOpenPaywall: () => router.push("/paywall"),
    engine,
  };
}
```

- [ ] **Step 4: Replace `PriceScannerScreen` JSX**

Replace the entire `export default function PriceScannerScreen()` with:

```tsx
export default function PriceScannerScreen() {
  const state = usePriceScannerState();

  if (state.permission === null) {
    return (
      <ScreenBackground className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="var(--color-ink)" />
      </ScreenBackground>
    );
  }

  if (!state.permission.granted) {
    return (
      <PermissionFallback
        onBack={state.handleBack}
        onRequestPermission={state.requestPermission}
      />
    );
  }

  return (
    <ScreenBackground className="flex-1 bg-black">
      <View className="relative flex-1">
        <CameraView
          ref={state.cameraRef}
          style={styles.camera}
          facing="back"
          zoom={state.engine.zoom}
          enableTorch={state.engine.flashlight}
        />

        <ViewfinderOverlay />

        <ScannerHeader
          isPro={state.isPro}
          onBack={state.handleBack}
          onOpenPaywall={state.handleOpenPaywall}
        />

        <CurrencySelectorBar
          from={state.engine.from}
          to={state.engine.to}
          onSwap={state.engine.swapCurrencies}
          onSelectBase={() => state.setIsPickerOpen({ side: "from" })}
          onSelectTarget={() => state.setIsPickerOpen({ side: "to" })}
          getCurrencyInfo={code => getCurrencyInfo(code, state.currenciesData)}
        />

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

        {state.engine.phase === "found" && state.engine.detectedPrice !== null && (
          <ScanResultCard
            scannedPrice={state.engine.detectedPrice}
            from={state.engine.from}
            to={state.engine.to}
            rates={state.rates}
            decimalPlaces={state.decimalPlaces}
            getCurrencyInfo={code => getCurrencyInfo(code, state.currenciesData)}
            onDismiss={state.engine.dismiss}
          />
        )}

        {state.isPickerOpen !== null && (
          <CurrencyPickerModal
            visible
            onClose={() => state.setIsPickerOpen(null)}
            onSelect={(code) => {
              if (state.isPickerOpen?.side === "from") state.engine.setFrom(code);
              else state.engine.setTo(code);
              state.setIsPickerOpen(null);
            }}
            currencies={state.selectableCurrencies}
            selectedCurrency={
              state.isPickerOpen?.side === "from" ? state.engine.from : state.engine.to
            }
            getCurrencyInfo={code => getCurrencyInfo(code, state.currenciesData)}
          />
        )}
      </View>
    </ScreenBackground>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/price-scanner.tsx
git commit -m "feat: wire price-scanner screen to use-price-scanner-engine with real OCR"
```

---

### Task 6: Quality checks

**Files:** No new files — fix in-place if needed.

- [ ] **Step 1: Run TypeScript check**

```bash
pnpm type-check
```

Expected: No errors. If errors appear, fix them in the flagged file before continuing.

- [ ] **Step 2: Run linter**

```bash
pnpm lint
```

Expected: No errors. Run `pnpm lint --fix` to auto-resolve spacing/import issues.

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 4: Commit any fixes (if needed)**

```bash
git add -p
git commit -m "fix: resolve lint and type errors in price scanner engine"
```

---

## Build & manual verification

A development build is required to exercise real OCR on device/simulator:

```bash
npx expo prebuild --clean
npx expo run:ios    # or run:android
```

Manual checklist:
1. Open price scanner → camera starts automatically
2. Point at a price tag → `ScanResultCard` appears with detected price + conversion
3. Dismiss → scanning resumes
4. Free user at 3 scans → 4th scan redirects to paywall
5. Flashlight toggle and zoom +/- still work
6. Currency swap and picker still work
