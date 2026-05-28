import { act, renderHook } from "@testing-library/react-native";
import { usePriceScannerEngine } from "../use-price-scanner-engine";

jest.mock("react-native-mlkit-ocr", () => ({
  default: { detectFromUri: jest.fn() },
}));

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
    act(() => {
      result.current.startScan();
    });
    expect(result.current.phase).toBe("scanning");
  });

  it("transitions back to idle on stopScan", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => {
      result.current.startScan();
    });
    act(() => {
      result.current.stopScan();
    });
    expect(result.current.phase).toBe("idle");
  });

  it("dismiss resets phase to idle and clears detectedPrice", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
  });

  it("clamps zoom to 0–1", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
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
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
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
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
    act(() => {
      result.current.swapCurrencies();
    });
    expect(result.current.from).toBe("EUR");
    expect(result.current.to).toBe("USD");
  });

  it("sets from and to independently", () => {
    const { result } = renderHook(() =>
      usePriceScannerEngine({ initialFrom: "USD", initialTo: "EUR", captureFrame: noop }),
    );
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
