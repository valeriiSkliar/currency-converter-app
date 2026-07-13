import { act, renderHook } from "@testing-library/react-native";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { useProPurchase } from "@/features/iap/use-pro-purchase";

const mockShowMessage = jest.fn();
jest.mock("react-native-flash-message", () => ({
  showMessage: (...args: unknown[]) => mockShowMessage(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockRequestPurchase = jest.fn(() => Promise.resolve());
const mockFinishTransaction = jest.fn(() => Promise.resolve());
const mockFetchProducts = jest.fn(() => Promise.resolve());
const mockGetActiveSubscriptions = jest.fn(() => Promise.resolve([] as unknown[]));

let capturedOptions: {
  onPurchaseSuccess?: (purchase: unknown) => void | Promise<void>;
  onPurchaseError?: (error: { code: string; message: string }) => void;
} = {};

jest.mock("expo-iap", () => ({
  ErrorCode: { UserCancelled: "user-cancelled" },
  useIAP: (options: typeof capturedOptions) => {
    capturedOptions = options;
    return {
      connected: true,
      subscriptions: [
        { id: "pro_monthly", displayPrice: "$4.99", price: 4.99 },
        { id: "pro_yearly", displayPrice: "$19.99", price: 19.99 },
      ],
      fetchProducts: mockFetchProducts,
      requestPurchase: mockRequestPurchase,
      finishTransaction: mockFinishTransaction,
      getActiveSubscriptions: mockGetActiveSubscriptions,
    };
  },
}));

describe("useProPurchase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQuotaStore.setState({ isPro: false });
  });

  it("fetches subscription products once connected", () => {
    renderHook(() => useProPurchase());
    expect(mockFetchProducts).toHaveBeenCalledWith({
      skus: ["pro_monthly", "pro_yearly"],
      type: "subs",
    });
  });

  it("exposes mapped plans and readiness", () => {
    const { result } = renderHook(() => useProPurchase());
    expect(result.current.isReady).toBe(true);
    expect(result.current.plans.map(p => p.sku)).toEqual([
      "pro_monthly",
      "pro_yearly",
    ]);
  });

  it("purchase() requests the subscription and flags processing", async () => {
    const { result } = renderHook(() => useProPurchase());
    await act(async () => {
      await result.current.purchase("pro_yearly");
    });
    expect(result.current.isProcessing).toBe(true);
    expect(mockRequestPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ type: "subs" }),
    );
  });

  it("unlocks PRO and finishes transaction on purchase success", async () => {
    const onPurchaseComplete = jest.fn();
    renderHook(() => useProPurchase({ onPurchaseComplete }));
    await act(async () => {
      await capturedOptions.onPurchaseSuccess?.({ productId: "pro_yearly" });
    });
    expect(mockFinishTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ isConsumable: false }),
    );
    expect(useQuotaStore.getState().isPro).toBe(true);
    expect(onPurchaseComplete).toHaveBeenCalled();
  });

  it("stays silent when the user cancels", async () => {
    renderHook(() => useProPurchase());
    await act(async () => {
      capturedOptions.onPurchaseError?.({ code: "user-cancelled", message: "x" });
    });
    expect(mockShowMessage).not.toHaveBeenCalled();
    expect(useQuotaStore.getState().isPro).toBe(false);
  });

  it("shows an error message for real purchase errors", async () => {
    renderHook(() => useProPurchase());
    await act(async () => {
      capturedOptions.onPurchaseError?.({ code: "unknown", message: "boom" });
    });
    expect(mockShowMessage).toHaveBeenCalled();
    expect(useQuotaStore.getState().isPro).toBe(false);
  });

  it("restore() unlocks PRO when an active subscription exists", async () => {
    mockGetActiveSubscriptions.mockResolvedValueOnce([{ productId: "pro_monthly" }]);
    const { result } = renderHook(() => useProPurchase());
    await act(async () => {
      await result.current.restore();
    });
    expect(useQuotaStore.getState().isPro).toBe(true);
  });

  it("restore() reports when nothing is found and does not unlock", async () => {
    mockGetActiveSubscriptions.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useProPurchase());
    await act(async () => {
      await result.current.restore();
    });
    expect(useQuotaStore.getState().isPro).toBe(false);
    expect(mockShowMessage).toHaveBeenCalled();
  });
});
