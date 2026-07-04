import { act, renderHook } from "@testing-library/react-native";
import MlkitOcr from "react-native-mlkit-ocr";
import { usePriceScannerEngine } from "../use-price-scanner-engine";

jest.mock("react-native-mlkit-ocr", () => ({
  __esModule: true,
  default: { detectFromUri: jest.fn() },
}));

const noop: () => Promise<string | null> = () => Promise.resolve(null);

function renderEngine(captureFrame = noop) {
  return renderHook(() =>
    usePriceScannerEngine({
      initialFrom: "USD",
      initialTo: "EUR",
      captureFrame,
    }),
  );
}

describe("usePriceScannerEngine — phase transitions", () => {
  it("starts in idle phase with null detectedPrice", () => {
    const { result } = renderEngine();
    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
    expect(result.current.from).toBe("USD");
    expect(result.current.to).toBe("EUR");
  });

  it("transitions to capturing while the photo is pending", async () => {
    let resolveFrame: (value: string | null) => void = jest.fn();
    const captureFrame = jest.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveFrame = resolve;
        }),
    );
    const { result } = renderEngine(captureFrame);
    let capturePromise = Promise.resolve();

    await act(async () => {
      capturePromise = result.current.capture();
    });
    expect(result.current.phase).toBe("capturing");

    await act(async () => {
      resolveFrame(null);
      await capturePromise;
    });
  });

  it("dismiss resets phase to idle and clears detectedPrice", () => {
    const { result } = renderEngine();
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
  });

  it("clears previous errors on dismiss", async () => {
    const { result } = renderEngine();
    await act(async () => {
      await result.current.capture();
    });
    expect(result.current.errorReason).toBe("capture_failed");

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.phase).toBe("idle");
    expect(result.current.errorReason).toBeNull();
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

describe("usePriceScannerEngine — OCR pipeline", () => {
  beforeEach(() => {
    (MlkitOcr.detectFromUri as jest.Mock).mockClear();
  });

  it("detects price and transitions to found after manual capture", async () => {
    const uri = "file:///mock/photo.jpg";
    const captureFrame = jest.fn().mockResolvedValue(uri);
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([{ text: "Espresso $4.50" }]);
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("found");
    expect(result.current.detectedPrice).toBe(4.5);
    expect(result.current.errorReason).toBeNull();
  });

  it("reports capture failure when no photo uri is returned", async () => {
    const captureFrame = jest.fn().mockResolvedValue(null);
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.errorReason).toBe("capture_failed");
    expect(MlkitOcr.detectFromUri).not.toHaveBeenCalled();
  });

  it("reports not found when OCR text contains no price", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([{ text: "Welcome to Coffee Shop" }]);
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.errorReason).toBe("not_found");
  });

  it("reports capture failure when OCR throws", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    (MlkitOcr.detectFromUri as jest.Mock).mockRejectedValue(new Error("OCR failed"));
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.errorReason).toBe("capture_failed");
  });

  it("ignores duplicate captures while one is already pending", async () => {
    let resolveFrame: (value: string | null) => void = jest.fn();
    const captureFrame = jest.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveFrame = resolve;
        }),
    );
    const { result } = renderEngine(captureFrame);
    let capturePromise = Promise.resolve();

    await act(async () => {
      capturePromise = result.current.capture();
      void result.current.capture();
    });
    expect(captureFrame).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFrame(null);
      await capturePromise;
    });
  });
});
