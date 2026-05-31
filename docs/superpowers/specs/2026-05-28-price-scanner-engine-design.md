# Price Scanner Engine — Design Spec

**Date:** 2026-05-28  
**Status:** Approved

## Context

The existing `price-scanner.tsx` embeds all logic in a local `usePriceScannerState` function (~80 lines) that mixes UI state, OCR mock, routing, and quota management in one place. The screen currently uses a 2.5-second mock timer that always returns $78.42.

Goal: extract a dedicated `use-price-scanner-engine` hook (matching the pattern of `use-calculator-engine.ts`) and replace the mock with real on-device OCR via Google ML Kit, plus a pure utility for parsing prices from OCR text.

## Architecture

### Files touched

| Action       | Path                                                       |
| ------------ | ---------------------------------------------------------- |
| **NEW**      | `src/features/converter/hooks/use-price-scanner-engine.ts` |
| **NEW**      | `src/features/converter/utils/price-ocr-parser.ts`         |
| **MODIFIED** | `src/app/(app)/price-scanner.tsx`                          |

### Responsibility split

| Layer                              | Owns                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `use-price-scanner-engine.ts`      | State machine (phase, detectedPrice, zoom, flashlight, from/to), OCR pipeline, auto-scan interval |
| `price-ocr-parser.ts`              | Pure regex parsing of price values from raw OCR text                                              |
| `usePriceScannerState` (in screen) | `cameraRef`, permissions, quota guard, navigation, exchange rates, currencies metadata            |

---

## `use-price-scanner-engine.ts`

### State machine

```
idle     → [startScan]    → scanning
scanning → [PRICE_FOUND]  → found
scanning → [stopScan]     → idle
found    → [dismiss]      → idle
```

OCR errors (e.g. `detectFromUri` throws) are caught inside the interval and logged — the engine stays in `scanning` and retries on the next tick. No separate error state: there is no error UI on the screen.

### Types

```ts
export type ScanPhase = "idle" | "scanning" | "found";

type ScannerState = {
  phase: ScanPhase;
  detectedPrice: number | null;
  zoom: number; // 0.0 – 1.0
  flashlight: boolean;
  from: string; // source currency code (scanner-local, not synced to store)
  to: string; // target currency code
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
  | { type: "SWAP_CURRENCIES" }
  | { type: "RESET"; from: string; to: string };
```

### Hook signature

```ts
export function usePriceScannerEngine(options: {
  initialFrom: string;
  initialTo: string;
  captureFrame: () => Promise<string | null>; // returns image URI or null
  scanIntervalMs?: number; // default: 2500
}): {
  phase: ScanPhase;
  detectedPrice: number | null;
  zoom: number;
  flashlight: boolean;
  from: string;
  to: string;
  startScan: () => void;
  stopScan: () => void;
  dismiss: () => void;
  setZoom: (val: number) => void;
  toggleFlashlight: () => void;
  setFrom: (code: string) => void;
  setTo: (code: string) => void;
  swapCurrencies: () => void;
};
```

### OCR pipeline (useEffect when `phase === "scanning"`)

`captureFrame` is stored in a `useRef` inside the engine so the interval's closure never goes stale and the effect is not re-triggered when the function reference changes.

```
captureFrameRef.current = captureFrame   // updated on each render, no re-effect

interval = setInterval(async () => {
  try {
    uri = await captureFrameRef.current()
    if (!uri) return

    blocks = await RNMLKitOcr.detectFromUri(uri)
    text   = blocks.map(b => b.text).join(" ")
    price  = parsePriceFromOcrText(text)

    if (price !== null) dispatch({ type: "PRICE_FOUND", price })
    // no price found → keep scanning silently on next tick
  } catch {
    // OCR error — log and retry on next tick, don't crash the loop
  }
}, scanIntervalMs)

cleanup: clearInterval(interval)
```

Effect deps: `[phase, scanIntervalMs]` — interval starts when phase becomes `"scanning"`, stops when phase leaves it.

---

## `price-ocr-parser.ts`

```ts
export function parsePriceFromOcrText(text: string): number | null;
```

Extraction priority:

1. Currency symbol prefix: `$78.42`, `€12.50`, `£5`
2. Currency symbol suffix: `78.42$`, `12,50€`
3. Plain decimal number: `78.42`, `12,50`

Normalisation: comma decimal separator → dot before `parseFloat`.  
Returns the **first** matched number. Returns `null` if nothing found.

---

## Screen integration (`usePriceScannerState` in `price-scanner.tsx`)

```ts
function usePriceScannerState() {
  const cameraRef = useRef<CameraView>(null);

  const { baseCurrency, targetCurrencies } = useConverterStore();
  const { isPro, ocrScanAttempts, incrementScanAttempt } = useQuotaStore();
  const { rates } = useExchangeRates();
  const { data: currenciesData } = useCurrencies();
  const decimalPlaces = useSettingsStore((s) => s.decimalPlaces);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const captureFrame = useCallback(async () => {
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

  // Start scanning once camera permission is granted
  useEffect(() => {
    if (permission?.granted) engine.startScan();
  }, [permission?.granted]);

  // Quota guard: intercept the transition into "found"
  const prevPhase = useRef(engine.phase);
  useEffect(() => {
    if (prevPhase.current !== "found" && engine.phase === "found") {
      if (!isPro && ocrScanAttempts >= 3) {
        engine.dismiss();
        router.push("/paywall");
      } else {
        incrementScanAttempt();
      }
    }
    prevPhase.current = engine.phase;
  }, [engine.phase]);

  return {
    cameraRef,
    permission,
    requestPermission,
    engine,
    isPro,
    ocrScanAttempts,
    rates,
    decimalPlaces,
    currenciesData,
    handleBack: router.back,
    handleOpenPaywall: () => router.push("/paywall"),
  };
}
```

`CameraView` in JSX receives `ref={cameraRef}`.  
All existing presentational components (`ScannerHeader`, `CurrencySelectorBar`, etc.) remain unchanged — they only receive props.

---

## Dependencies

```bash
pnpm add react-native-mlkit-ocr
npx expo prebuild   # required — this is a native module, Expo Go not supported
```

Add to `app.config.ts` plugins if needed per library docs.

---

## Verification

1. `pnpm type-check` — no TypeScript errors
2. `pnpm lint` — no ESLint violations (max-lines-per-function: engine ≤110 lines)
3. Development build on iOS/Android simulator
4. Permission granted → scanning starts automatically
5. OCR finds a price → `ScanResultCard` appears with correct conversion
6. Free user at limit (ocrScanAttempts ≥ 3) → redirected to paywall on next scan
7. Flashlight toggle, zoom +/- work as before
8. Currency swap and picker work as before
9. Dismiss → scanning resumes
