import { act, renderHook } from "@testing-library/react-native";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { useProStatusSync } from "@/features/iap/use-pro-status-sync";

const mockHasActiveSubscriptions = jest.fn(() => Promise.resolve(false));
function mockCreateIap() {
  return {
    connected: true,
    hasActiveSubscriptions: mockHasActiveSubscriptions,
  };
}

jest.mock("expo-iap", () => ({
  useIAP: mockCreateIap,
}));

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useProStatusSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revokes PRO when the store reports no active subscription", async () => {
    useQuotaStore.setState({ isPro: true });
    renderHook(() => useProStatusSync());
    await flushEffects();
    expect(useQuotaStore.getState().isPro).toBe(false);
  });

  it("keeps PRO when an active subscription exists", async () => {
    mockHasActiveSubscriptions.mockResolvedValueOnce(true);
    useQuotaStore.setState({ isPro: true });
    renderHook(() => useProStatusSync());
    await flushEffects();
    expect(useQuotaStore.getState().isPro).toBe(true);
  });

  it("keeps PRO when the store check fails offline", async () => {
    mockHasActiveSubscriptions.mockRejectedValueOnce(new Error("offline"));
    useQuotaStore.setState({ isPro: true });
    renderHook(() => useProStatusSync());
    await flushEffects();
    expect(useQuotaStore.getState().isPro).toBe(true);
  });

  it("does nothing for free users", async () => {
    useQuotaStore.setState({ isPro: false });
    renderHook(() => useProStatusSync());
    await flushEffects();
    expect(mockHasActiveSubscriptions).not.toHaveBeenCalled();
  });
});
