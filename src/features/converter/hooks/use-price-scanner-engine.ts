import * as React from "react";
import MlkitOcr from "react-native-mlkit-ocr";
import { parsePriceFromOcrText } from "@/features/converter/utils/price-ocr-parser";

export type ScanErrorReason = "not_found" | "capture_failed";
export type ScanPhase = "idle" | "capturing" | "found";

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
  = | { type: "BEGIN_CAPTURE" }
    | { type: "PRICE_FOUND"; price: number }
    | { type: "CAPTURE_ERROR"; reason: ScanErrorReason }
    | { type: "DISMISS" }
    | { type: "SET_ZOOM"; zoom: number }
    | { type: "TOGGLE_FLASHLIGHT" }
    | { type: "SET_FROM"; code: string }
    | { type: "SET_TO"; code: string }
    | { type: "SWAP_CURRENCIES" };

function scannerReducer(state: ScannerState, action: ScannerAction): ScannerState {
  switch (action.type) {
    case "BEGIN_CAPTURE":
      return state.phase === "capturing"
        ? state
        : { ...state, phase: "capturing", detectedPrice: null, errorReason: null };
    case "PRICE_FOUND":
      return { ...state, phase: "found", detectedPrice: action.price, errorReason: null };
    case "CAPTURE_ERROR":
      return {
        ...state,
        phase: "idle",
        detectedPrice: null,
        errorReason: action.reason,
      };
    case "DISMISS":
      return { ...state, phase: "idle", detectedPrice: null, errorReason: null };
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

type DetectPriceResult = { price: number } | { reason: ScanErrorReason };

async function detectPriceFromFrame(
  captureFrame: () => Promise<string | null>,
): Promise<DetectPriceResult> {
  const uri = await captureFrame();
  if (!uri) {
    return { reason: "capture_failed" as const };
  }

  const blocks = await MlkitOcr.detectFromUri(uri);
  const text = (blocks as Array<{ text: string }>).map(block => block.text).join(" ");
  const price = parsePriceFromOcrText(text);

  return price === null ? { reason: "not_found" as const } : { price };
}

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
  const isCapturingRef = React.useRef(false);
  captureFrameRef.current = captureFrame;

  const capture = React.useCallback(async () => {
    if (isCapturingRef.current)
      return;

    isCapturingRef.current = true;
    dispatch({ type: "BEGIN_CAPTURE" });

    try {
      const result = await detectPriceFromFrame(captureFrameRef.current);
      if ("price" in result) {
        dispatch({ type: "PRICE_FOUND", price: result.price });
      }
      else {
        dispatch({ type: "CAPTURE_ERROR", reason: result.reason });
      }
    }
    catch {
      dispatch({ type: "CAPTURE_ERROR", reason: "capture_failed" });
    }
    finally {
      isCapturingRef.current = false;
    }
  }, []);

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
