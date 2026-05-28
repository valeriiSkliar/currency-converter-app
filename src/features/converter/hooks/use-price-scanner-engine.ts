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

type ScannerAction
  = | { type: "START_SCAN" }
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
    if (state.phase !== "scanning")
      return;

    const intervalId = setInterval(async () => {
      try {
        const uri = await captureFrameRef.current();
        if (!uri)
          return;
        const blocks = await MlkitOcr.detectFromUri(uri);
        const text = (blocks as Array<{ text: string }>).map(b => b.text).join(" ");
        const price = parsePriceFromOcrText(text);
        if (price !== null) {
          dispatch({ type: "PRICE_FOUND", price });
        }
      }
      catch {
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
