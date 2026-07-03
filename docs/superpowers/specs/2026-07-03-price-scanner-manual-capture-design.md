# Price Scanner — Manual Capture Design Spec

**Date:** 2026-07-03
**Status:** Approved
**Supersedes (partially):** `2026-05-28-price-scanner-engine-design.md` — the auto-scan interval described there is removed by this spec; everything else in that document (OCR parser, quota guard, screen composition) still applies unless noted below.

## Context

The price scanner (`src/app/(app)/price-scanner.tsx` + `use-price-scanner-engine.ts`) currently auto-starts a continuous scan loop the moment camera permission is granted: every `scanIntervalMs` (default 2500ms) it silently captures a frame, runs ML Kit OCR, and looks for a price. This burns battery/CPU continuously, and takes control away from the user — the first random price string in the frame wins, whether or not it's the one the user is pointing at.

**Goal:** remove the automatic timer-driven scanning entirely. The user aims the camera and explicitly triggers a single capture via a shutter button. That single frame is OCR'd once; the result (price found, not found, or capture error) is reported back. Everything else about the scanner (zoom, flashlight, currency selection, free-scan quota, paywall) is unchanged.

## Architecture

### Files touched

| Action       | Path                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| MODIFIED     | `src/features/converter/hooks/use-price-scanner-engine.ts`                     |
| MODIFIED     | `src/features/converter/hooks/__tests__/use-price-scanner-engine.test.ts`       |
| MODIFIED     | `src/app/(app)/price-scanner.tsx`                                               |
| UNCHANGED    | `src/features/converter/utils/price-ocr-parser.ts`                             |

### Responsibility split (unchanged from prior spec)

| Layer                          | Owns                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `use-price-scanner-engine.ts`  | State machine (phase, detectedPrice, errorReason, zoom, flashlight, from/to), OCR pipeline |
| `price-ocr-parser.ts`          | Pure regex parsing of price values from raw OCR text — unchanged                          |
| `usePriceScannerState` (screen)| `cameraRef`, permissions, quota guard, navigation, exchange rates, currencies metadata    |

---

## `use-price-scanner-engine.ts`

### State machine

```
idle       → [capture, guarded]      → capturing
capturing  → [CAPTURE_SUCCESS]       → found
capturing  → [CAPTURE_NOT_FOUND]     → error (reason: "not_found")
capturing  → [CAPTURE_ERROR]         → error (reason: "capture_failed")
error      → [auto-timer, ~2s]       → idle
found      → [dismiss]               → idle
```

Removed entirely: `"scanning"` phase, `START_SCAN`/`STOP_SCAN` actions, `scanIntervalMs` option, the `setInterval` effect.

A second `capture()` call while `phase === "capturing"` is a no-op (guarded at the top of the function) — prevents overlapping captures from rapid double-taps on the shutter button.

### Types

```ts
export type ScanPhase = "idle" | "capturing" | "found" | "error";
export type ScanErrorReason = "not_found" | "capture_failed";

type ScannerState = {
  phase: ScanPhase;
  detectedPrice: number | null;
  errorReason: ScanErrorReason | null;
  zoom: number; // 0.0 – 1.0
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
```

`CAPTURE_START` only transitions when `phase === "idle" || phase === "error"` (mirrors current `START_SCAN` guard pattern, just against the new phase set).

### Hook signature

```ts
export function usePriceScannerEngine(options: {
  initialFrom: string;
  initialTo: string;
  captureFrame: () => Promise<string | null>;
}): {
  phase: ScanPhase;
  detectedPrice: number | null;
  errorReason: ScanErrorReason | null;
  zoom: number;
  flashlight: boolean;
  from: string;
  to: string;
  capture: () => Promise<void>;
  dismiss: () => void;
  setZoom: (val: number) => void;
  toggleFlashlight: () => void;
  setFrom: (code: string) => void;
  setTo: (code: string) => void;
  swapCurrencies: () => void;
};
```

`scanIntervalMs` is removed from the options — there is no interval anymore.

### Capture pipeline (replaces the `setInterval` effect)

```ts
const capture = React.useCallback(async () => {
  if (stateRef.current.phase === "capturing") return; // guard against double-tap

  dispatch({ type: "CAPTURE_START" });
  try {
    const uri = await captureFrameRef.current();
    if (!uri) {
      dispatch({ type: "CAPTURE_ERROR" });
      return;
    }
    const blocks = await MlkitOcr.detectFromUri(uri);
    const text = blocks.map(b => b.text).join(" ");
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
```

A `stateRef` (mirrors `state`, updated every render, same pattern already used for `captureFrameRef`) is needed so the guard reads current phase without adding `state` to the callback's deps.

### Auto-return from error to idle

```ts
React.useEffect(() => {
  if (state.phase !== "error") return;
  const timerId = setTimeout(() => dispatch({ type: "RESET_TO_IDLE" }), 2000);
  return () => clearTimeout(timerId);
}, [state.phase]);
```

If the user taps the shutter again while the error banner is still showing, `capture()` runs immediately (phase `"error"` is a valid start state) — the pending `RESET_TO_IDLE` timeout fires harmlessly afterward against whatever the phase has become by then (harmless because `RESET_TO_IDLE` should only apply from `"error"`; the reducer guards it the same way `CAPTURE_START` is guarded).

---

## Screen integration (`price-scanner.tsx`)

### Removed

- The effect that called `engine.startScan()` on `permission?.granted`. The screen now opens straight into `idle` with a live, static (non-auto-scanning) viewfinder.

### Added

**`ShutterButton`** — new presentational component, bottom-center, standard camera shutter styling (circular, white ring). Props: `onPress`, `disabled`. Rendered when `phase` is `"idle"` or `"error"`; shows a spinner overlay and `disabled` when `phase === "capturing"`.

**`ScanErrorBanner`** — new presentational component, styled consistently with `LimitBanner` (rounded card, bottom area). Props: `reason: ScanErrorReason`. Text:
- `"not_found"` → `converter.priceNotFound` ("Цена не распознана. Наведите камеру точнее и нажмите кнопку снимка ещё раз.")
- `"capture_failed"` → `converter.captureFailed` ("Не удалось сделать снимок. Попробуйте ещё раз.")

Rendered when `phase === "error"`. Disappears automatically along with the phase transition back to `idle` (no dismiss button needed — the 2s auto-timer in the engine drives this).

### Unchanged

`ScannerHeader`, `CurrencySelectorBar`, `ViewfinderControls` (zoom/flashlight), `LimitBanner`, `ScanResultCard`, `CurrencyPickerModal`, `PermissionFallback`, the quota-guard effect watching `engine.phase === "found"`, and all store/query wiring in `usePriceScannerState`.

The quota guard effect's dependency on `enginePhase` continues to work unchanged — it still only fires logic on transition into `"found"`, which still only happens via a successful `capture()`.

---

## New translation keys

Add to all three existing catalogs — `src/translations/en.json`, `ru.json`, `ar.json` (all three already contain `converter.priceScanner` and sibling keys, so follow the existing `converter.*` key placement):

- `converter.priceNotFound`
- `converter.captureFailed`
- `converter.shutterButtonLabel` (accessibility label for `ShutterButton`, e.g. "Capture price")

---

## Testing

### `use-price-scanner-engine.test.ts` — replace interval-based suite

Remove entirely:
- `"detects price and transitions to found after one interval tick"`
- `"keeps scanning when captureFrame returns null"`
- `"keeps scanning when OCR text contains no price"`
- `"does not crash and keeps scanning when OCR throws"`
- `"stops calling captureFrame after stopScan"`
- Any `startScan`/`stopScan` phase-transition tests tied to the `"scanning"` phase.

Add:
- `capture()` success → phase goes `idle` → `capturing` → `found`, `detectedPrice` set correctly.
- `capture()` when `captureFrame` resolves `null` → phase ends at `"error"`, `errorReason === "capture_failed"`.
- `capture()` when OCR resolves with no parseable price → phase ends at `"error"`, `errorReason === "not_found"`.
- `capture()` when `MlkitOcr.detectFromUri` rejects → phase ends at `"error"`, `errorReason === "capture_failed"`, no throw.
- Calling `capture()` a second time while the first is still in-flight (unresolved promise) → second call is a no-op, `captureFrame` mock only invoked once.
- `error` phase auto-transitions to `"idle"` after the timeout (fake timers, `jest.advanceTimersByTime(2000)`).
- Calling `capture()` again while `phase === "error"` (before the auto-timer fires) starts a new capture immediately.
- Existing zoom/flashlight/from/to/swap tests carry over unchanged (no behavior change there).

### `price-scanner.tsx` (add if no render tests currently exist for this screen; check `src/app/(app)/__tests__/` or co-located tests first)

- `ShutterButton` is `disabled` and shows a spinner when `phase === "capturing"`.
- `ScanErrorBanner` renders the correct message per `errorReason`.
- `ScanResultCard` still renders on `"found"` exactly as before.

---

## QA scope (broader than this change — full price-scanner feature audit)

The user asked for a separate bug-hunt and test-scenario pass covering the **entire** price-scanner feature (not just this manual-capture change), since the refactor touches shared logic (quota, OCR parsing, permissions) that could already have latent issues. This section is a planning aid for that follow-up pass — it is not implementation scope for this spec.

### Known risk areas to investigate (found via code read, not yet verified as bugs)

1. **`price-ocr-parser.ts` — `PLAIN_DECIMAL_REGEX`** matches *any* bare decimal number in the frame (dates, phone numbers, addresses, other price tags in the background), not just the one the user intends. With auto-scan gone this matters more, since a single manual snapshot has one shot — a false match on background clutter is now a direct user-facing miss rather than something the next tick could self-correct.
2. **Currency symbol coverage** — `CURRENCY_SYMBOLS = "[$€£¥₹₩₺]"` omits common symbols (₽ ruble, ₴ hryvnia, ₦, R$, kr, zł, etc.) — prefix/suffix detection silently falls through to the plain-decimal path for those, discarding currency-symbol confidence.
3. **`getCurrencyInfo` in `price-scanner.tsx`** takes `currenciesData: any[] | undefined` — no type safety; a shape change in the `/v1/currencies` response would fail silently (`found.name || code`) rather than surface as a type error.
4. **Quota store (`use-quota-store.ts`)** — free-scan limit is local MMKV state; verify whether it's meant to be device-local (reinstall resets it) or should be tied to a server-side/account-level counter. Worth confirming intended behavior with product, not just flagging as a bug.
5. **`captureFrame`'s `skipProcessing: true`** — can produce incorrectly-oriented images on some Android devices per `expo-camera` known issues; worth a real-device check across a couple of Android camera orientations.
6. **Permission re-prompt flow** — `PermissionFallback`'s "Don't allow" button calls `onBack`; verify behavior when the user later re-opens the scanner after a permanent OS-level denial (should route to system settings, not just re-show the in-app fallback with a non-functional "Allow" button).
7. **Race on rapid navigation away during `capturing`** — if the user backs out of the screen while `capture()`'s promise is in flight, verify the OCR result dispatch after unmount doesn't produce a React warning or a stray state update (may need an `isMounted`/abort guard once the async work outlives the component).

### Test scenario matrix (for the follow-up QA pass)

- **Happy path:** point at a clearly printed price, tap shutter, correct price detected, correct converted amount shown, dismiss returns to idle.
- **Permissions:** first-time prompt (allow/deny), previously denied → re-open screen, OS-level permanent denial → settings redirect.
- **Capture failures:** no price in frame, blurry/low-light frame, extreme zoom, frame with multiple numbers (price + unrelated number), frame with no text at all.
- **Currency symbols:** each symbol in `CURRENCY_SYMBOLS`, plus at least one symbol *not* in the set (e.g. ₽) to confirm graceful fallback behavior.
- **Decimal formats:** dot decimal (`4.50`), comma decimal (`4,50`), thousands separator collision (`1,234` vs `1,23`).
- **Quota/paywall:** 3rd successful scan as free user → 4th attempt routes to paywall; Pro user has no limit; quota banner count is accurate.
- **Controls during capture:** zoom/flashlight toggles disabled or ignored while `phase === "capturing"` (define expected behavior if not already obvious); currency swap after a `"found"` result recalculates correctly.
- **Rapid interaction:** double/triple-tap shutter in quick succession → only one capture in flight, no crash, no duplicate quota decrement.
- **Navigation:** back out of scanner mid-capture, re-enter scanner after a completed scan, device rotation while camera is open.
- **Accessibility:** shutter button has an accessible label/role for screen readers; error banner text is announced.

---

## Verification (for this spec's implementation)

1. `pnpm type-check` — no TypeScript errors.
2. `pnpm lint` — no ESLint violations (`max-lines-per-function` ≤ 110 lines still respected in the engine file).
3. `pnpm test` — updated engine test suite passes; no leftover references to `startScan`/`stopScan`/`scanIntervalMs` anywhere in the codebase (`grep -r` check).
4. Development build on iOS/Android: opening the scanner shows a live, non-scanning viewfinder; tapping the shutter captures once and shows a result or error; error banner auto-dismisses; quota/paywall trigger correctly on the 4th free scan; zoom/flashlight/currency swap/picker unchanged.
5. `pnpm check-all` passes (lint, type-check, translation key matching, tests).
