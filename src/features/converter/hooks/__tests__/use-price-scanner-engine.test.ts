import { act, renderHook, waitFor } from "@testing-library/react-native";
import MlkitOcr from "react-native-mlkit-ocr";
import { usePriceScannerEngine } from "../use-price-scanner-engine";

jest.mock("react-native-mlkit-ocr", () => ({
  __esModule: true,
  default: { detectFromUri: jest.fn() },
}));

type CaptureFrame = () => Promise<string | null>;

const noop: CaptureFrame = () => Promise.resolve(null);
const detectFromUriMock = MlkitOcr.detectFromUri as jest.Mock;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function renderEngine(captureFrame: CaptureFrame = noop) {
  return renderHook(() =>
    usePriceScannerEngine({
      initialFrom: "USD",
      initialTo: "EUR",
      captureFrame,
    }),
  );
}

describe("usePriceScannerEngine - phase transitions", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("starts in idle phase with null detected price and error reason", () => {
    const { result } = renderEngine();

    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
    expect(result.current.errorReason).toBeNull();
    expect(result.current.from).toBe("USD");
    expect(result.current.to).toBe("EUR");
  });

  it("moves through capturing and found when OCR contains a price", async () => {
    const frame = createDeferred<string | null>();
    const captureFrame = jest.fn(() => frame.promise);
    detectFromUriMock.mockResolvedValue([{ text: "Espresso $4.50" }]);
    const { result } = renderEngine(captureFrame);

    let capturePromise: Promise<void>;
    act(() => {
      capturePromise = result.current.capture();
    });

    expect(result.current.phase).toBe("capturing");
    expect(captureFrame).toHaveBeenCalledTimes(1);

    await act(async () => {
      frame.resolve("file:///mock/photo.jpg");
      await capturePromise;
    });

    expect(MlkitOcr.detectFromUri).toHaveBeenCalledWith("file:///mock/photo.jpg");
    expect(result.current.phase).toBe("found");
    expect(result.current.detectedPrice).toBe(4.5);
    expect(result.current.errorReason).toBeNull();
  });

  it("ignores capture requests while a capture is already running", async () => {
    const frame = createDeferred<string | null>();
    const captureFrame = jest.fn(() => frame.promise);
    detectFromUriMock.mockResolvedValue([{ text: "$9.99" }]);
    const { result } = renderEngine(captureFrame);

    let firstCapture: Promise<void>;
    act(() => {
      firstCapture = result.current.capture();
      void result.current.capture();
    });

    expect(result.current.phase).toBe("capturing");
    expect(captureFrame).toHaveBeenCalledTimes(1);

    await act(async () => {
      frame.resolve("file:///mock/photo.jpg");
      await firstCapture;
    });

    expect(result.current.phase).toBe("found");
    expect(result.current.detectedPrice).toBe(9.99);
  });

  it("dismiss resets phase to idle and clears scan data", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    detectFromUriMock.mockResolvedValue([{ text: "$12.00" }]);
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });
    act(() => {
      result.current.dismiss();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.detectedPrice).toBeNull();
    expect(result.current.errorReason).toBeNull();
  });
});

describe("usePriceScannerEngine - capture errors", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("sets capture_failed when captureFrame returns null", async () => {
    const captureFrame = jest.fn().mockResolvedValue(null);
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("error");
    expect(result.current.errorReason).toBe("capture_failed");
    expect(result.current.detectedPrice).toBeNull();
    expect(MlkitOcr.detectFromUri).not.toHaveBeenCalled();
  });

  it("sets not_found when OCR text contains no price", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    detectFromUriMock.mockResolvedValue([{ text: "Welcome to Coffee Shop" }]);
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("error");
    expect(result.current.errorReason).toBe("not_found");
    expect(result.current.detectedPrice).toBeNull();
  });

  it("sets capture_failed when captureFrame throws", async () => {
    const captureFrame = jest.fn().mockRejectedValue(new Error("camera failed"));
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("error");
    expect(result.current.errorReason).toBe("capture_failed");
    expect(result.current.detectedPrice).toBeNull();
  });

  it("sets capture_failed when OCR throws", async () => {
    const captureFrame = jest.fn().mockResolvedValue("file:///mock/photo.jpg");
    detectFromUriMock.mockRejectedValue(new Error("OCR failed"));
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("error");
    expect(result.current.errorReason).toBe("capture_failed");
    expect(result.current.detectedPrice).toBeNull();
  });
});

describe("usePriceScannerEngine - error auto-reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("auto-resets an error back to idle after 2000ms", async () => {
    jest.useFakeTimers();
    const captureFrame = jest.fn().mockResolvedValue(null);
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("error");

    act(() => {
      jest.advanceTimersByTime(1999);
    });
    expect(result.current.phase).toBe("error");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("idle");
      expect(result.current.errorReason).toBeNull();
    });
  });

  it("allows an immediate re-capture from the error phase before the auto-reset fires", async () => {
    jest.useFakeTimers();
    const captureFrame = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("file:///mock/photo.jpg");
    detectFromUriMock.mockResolvedValue([{ text: "$9.99" }]);
    const { result } = renderEngine(captureFrame);

    await act(async () => {
      await result.current.capture();
    });
    expect(result.current.phase).toBe("error");
    expect(result.current.errorReason).toBe("capture_failed");

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current.phase).toBe("error");

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.phase).toBe("found");
    expect(result.current.detectedPrice).toBe(9.99);
    expect(result.current.errorReason).toBeNull();
  });
});

describe("usePriceScannerEngine - controls", () => {
  it("clamps zoom to 0-1", () => {
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
