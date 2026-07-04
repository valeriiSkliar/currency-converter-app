import type { MKLBlock } from "react-native-mlkit-ocr";
import * as React from "react";
import MlkitOcr from "react-native-mlkit-ocr";
import { parsePriceFromOcrText } from "@/features/converter/utils/price-ocr-parser";
import { filterBlocksInViewfinder } from "@/features/converter/utils/viewfinder-region";

const ERROR_RESET_DELAY_MS = 2000;

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

export type CapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

export type ViewSize = {
  width: number;
  height: number;
};

function scannerReducer(state: ScannerState, action: ScannerAction): ScannerState {
  switch (action.type) {
    case "CAPTURE_START":
      return state.phase === "idle" || state.phase === "error"
        ? { ...state, phase: "capturing", detectedPrice: null, errorReason: null }
        : state;
    case "CAPTURE_SUCCESS":
      return state.phase === "capturing"
        ? { ...state, phase: "found", detectedPrice: action.price, errorReason: null }
        : state;
    case "CAPTURE_NOT_FOUND":
      return state.phase === "capturing"
        ? { ...state, phase: "error", detectedPrice: null, errorReason: "not_found" }
        : state;
    case "CAPTURE_ERROR":
      return state.phase === "capturing"
        ? { ...state, phase: "error", detectedPrice: null, errorReason: "capture_failed" }
        : state;
    case "RESET_TO_IDLE":
      return state.phase === "error"
        ? { ...state, phase: "idle", detectedPrice: null, errorReason: null }
        : state;
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

async function detectPriceFromCapture(
  photo: CapturedPhoto,
  view: ViewSize,
) {
  const blocks: MKLBlock[] = await MlkitOcr.detectFromUri(photo.uri);
  // Filter at line granularity, not block granularity: MLKit sometimes merges several
  // visually-adjacent receipt rows into a single block with one bounding box spanning all of
  // them, which would defeat viewfinder filtering. Each line within a block keeps its own tight
  // bounding box, so line-level filtering correctly isolates just the row the user aimed at.
  const lines = blocks.flatMap(block => block.lines);
  const relevantLines = filterBlocksInViewfinder(lines, photo, view);
  const text = relevantLines.map(line => line.text).join(" ");
  console.log("[scanner-debug] photo:", photo.width, photo.height, "view:", view.width, view.height);
  console.log("[scanner-debug] all lines:", JSON.stringify(
    lines.map(l => ({ text: l.text, bounding: l.bounding })),
  ));
  console.log("[scanner-debug] in-viewfinder text:", JSON.stringify(text));

  const price = parsePriceFromOcrText(text);
  console.log("[scanner-debug] parsed price:", price);
  return price;
}

export type PriceScannerEngineOptions = {
  initialFrom: string;
  initialTo: string;
  captureFrame: () => Promise<CapturedPhoto | null>;
  getViewSize: () => ViewSize;
};

function createInitialState(initialFrom: string, initialTo: string): ScannerState {
  return {
    phase: "idle",
    detectedPrice: null,
    errorReason: null,
    zoom: 0,
    flashlight: false,
    from: initialFrom,
    to: initialTo,
  };
}

function canStartCapture(phase: ScanPhase) {
  return phase === "idle" || phase === "error";
}

export function usePriceScannerEngine({
  initialFrom,
  initialTo,
  captureFrame,
  getViewSize,
}: PriceScannerEngineOptions) {
  const [state, dispatch] = React.useReducer(
    scannerReducer,
    createInitialState(initialFrom, initialTo),
  );
  const captureFrameRef = React.useRef(captureFrame);
  const getViewSizeRef = React.useRef(getViewSize);
  const phaseRef = React.useRef<ScanPhase>(state.phase);

  captureFrameRef.current = captureFrame;
  getViewSizeRef.current = getViewSize;
  phaseRef.current = state.phase;

  React.useEffect(() => {
    if (state.phase !== "error")
      return;

    const timeoutId = setTimeout(() => {
      dispatch({ type: "RESET_TO_IDLE" });
    }, ERROR_RESET_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [state.phase]);

  const capture = React.useCallback(async () => {
    if (!canStartCapture(phaseRef.current))
      return;

    phaseRef.current = "capturing";
    dispatch({ type: "CAPTURE_START" });

    try {
      const photo = await captureFrameRef.current();
      if (!photo) {
        dispatch({ type: "CAPTURE_ERROR" });
        return;
      }

      const price = await detectPriceFromCapture(photo, getViewSizeRef.current());
      dispatch(price === null ? { type: "CAPTURE_NOT_FOUND" } : { type: "CAPTURE_SUCCESS", price });
    }
    catch {
      dispatch({ type: "CAPTURE_ERROR" });
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
