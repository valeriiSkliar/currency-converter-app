import { useConverterStore } from "@/features/converter/store/use-converter-store";

beforeEach(() => {
  useConverterStore.setState({
    baseCurrency: "USD",
    targetCurrencies: ["EUR", "GBP", "UAH"],
    amount: "100",
    customRates: {},
  });
});

describe("useConverterStore", () => {
  it("has default state", () => {
    const state = useConverterStore.getState();
    expect(state.baseCurrency).toBe("USD");
    expect(state.targetCurrencies).toEqual(["EUR", "GBP", "UAH"]);
    expect(state.amount).toBe("100");
    expect(state.customRates).toEqual({});
  });

  it("updates base currency and target currencies list", () => {
    useConverterStore.getState().setBaseCurrency("EUR");
    expect(useConverterStore.getState().baseCurrency).toBe("EUR");

    useConverterStore.getState().setTargetCurrencies(["USD", "GBP"]);
    expect(useConverterStore.getState().targetCurrencies).toEqual(["USD", "GBP"]);
  });

  it("updates amount", () => {
    useConverterStore.getState().updateAmount("250.5");
    expect(useConverterStore.getState().amount).toBe("250.5");
  });

  it("adds new currency only if not already present", () => {
    // Add existing target
    useConverterStore.getState().addCurrency("EUR");
    expect(useConverterStore.getState().targetCurrencies).toEqual(["EUR", "GBP", "UAH"]);

    // Add base currency
    useConverterStore.getState().addCurrency("USD");
    expect(useConverterStore.getState().targetCurrencies).toEqual(["EUR", "GBP", "UAH"]);

    // Add new currency
    useConverterStore.getState().addCurrency("RUB");
    expect(useConverterStore.getState().targetCurrencies).toEqual(["EUR", "GBP", "UAH", "RUB"]);
  });

  it("removes currency", () => {
    useConverterStore.getState().removeCurrency("GBP");
    expect(useConverterStore.getState().targetCurrencies).toEqual(["EUR", "UAH"]);
  });

  it("swaps base currency with target row, placing old base at the row's index", () => {
    // Swap base (USD) with row UAH (index 2)
    useConverterStore.getState().swapBaseWithRow("UAH");
    expect(useConverterStore.getState().baseCurrency).toBe("UAH");
    expect(useConverterStore.getState().targetCurrencies).toEqual(["EUR", "GBP", "USD"]);
  });

  it("sets custom rate override", () => {
    useConverterStore.getState().setCustomRate("USD_EUR", 0.92);
    expect(useConverterStore.getState().customRates).toEqual({ USD_EUR: 0.92 });
  });
});
