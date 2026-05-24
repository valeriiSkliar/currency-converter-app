import { useConverterStore } from "@/features/converter/store/use-converter-store";

beforeEach(() => {
  useConverterStore.setState({ fromCurrency: "USD", toCurrency: "EUR" });
});

describe("useConverterStore", () => {
  it("has default fromCurrency USD", () => {
    expect(useConverterStore.getState().fromCurrency).toBe("USD");
  });

  it("has default toCurrency EUR", () => {
    expect(useConverterStore.getState().toCurrency).toBe("EUR");
  });

  it("setFromCurrency updates fromCurrency", () => {
    useConverterStore.getState().setFromCurrency("GBP");
    expect(useConverterStore.getState().fromCurrency).toBe("GBP");
  });

  it("setToCurrency updates toCurrency", () => {
    useConverterStore.getState().setToCurrency("JPY");
    expect(useConverterStore.getState().toCurrency).toBe("JPY");
  });
});
