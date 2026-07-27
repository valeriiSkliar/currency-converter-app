import { useQuotaStore } from "@/features/converter/store/use-quota-store";

beforeEach(() => {
  useQuotaStore.setState({
    isPro: false,
    customRateAttempts: 0,
    ocrScanAttempts: 0,
  });
});

describe("useQuotaStore", () => {
  it("has default state values", () => {
    const state = useQuotaStore.getState();
    expect(state.isPro).toBe(false);
    expect(state.customRateAttempts).toBe(0);
    expect(state.ocrScanAttempts).toBe(0);
  });

  it("increments custom rate change attempts count", () => {
    useQuotaStore.getState().incrementRateAttempt();
    expect(useQuotaStore.getState().customRateAttempts).toBe(1);

    useQuotaStore.getState().incrementRateAttempt();
    expect(useQuotaStore.getState().customRateAttempts).toBe(2);
  });

  it("increments OCR scans attempts count", () => {
    useQuotaStore.getState().incrementScanAttempt();
    expect(useQuotaStore.getState().ocrScanAttempts).toBe(1);

    useQuotaStore.getState().incrementScanAttempt();
    expect(useQuotaStore.getState().ocrScanAttempts).toBe(2);
  });

  it("unlocks PRO plan", () => {
    useQuotaStore.getState().unlockPro();
    expect(useQuotaStore.getState().isPro).toBe(true);
  });

  it("resets attempts counter", () => {
    useQuotaStore.getState().incrementRateAttempt();
    useQuotaStore.getState().incrementScanAttempt();
    expect(useQuotaStore.getState().customRateAttempts).toBe(1);
    expect(useQuotaStore.getState().ocrScanAttempts).toBe(1);

    useQuotaStore.getState().resetAttempts();
    expect(useQuotaStore.getState().customRateAttempts).toBe(0);
    expect(useQuotaStore.getState().ocrScanAttempts).toBe(0);
  });

  it("revokePro sets isPro back to false", () => {
    useQuotaStore.getState().unlockPro();
    expect(useQuotaStore.getState().isPro).toBe(true);

    useQuotaStore.getState().revokePro();
    expect(useQuotaStore.getState().isPro).toBe(false);
  });
});
